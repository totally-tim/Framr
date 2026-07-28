import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ImageFile } from '../types';
import { SECTION_HEADING } from './typography';
import { cx } from './ui';

interface ImageQueueProps {
  images: ImageFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
}

/** How far a pointer travels before a press stops being a tap and becomes a reorder drag. */
const DRAG_THRESHOLD_PX = 6;

/* Edge autoscroll. Native drag-and-drop scrolls a container for free when the
   pointer is held near its edge; Pointer Events do not, so a queue taller than
   its viewport could only be reordered within the slice already on screen.
   The band is deep enough to hit without precision and shallow enough to leave
   the middle of a short list alone, and the speed ramps from nothing at the
   band's inner edge to the cap at the boundary, so nudging into it creeps and
   pushing right up to the edge moves at a useful rate. */
const AUTOSCROLL_BAND_PX = 48;
const AUTOSCROLL_MAX_PX_PER_FRAME = 14;

/**
 * Pixels to scroll this frame for a pointer at `clientY`, signed, or 0 when the
 * pointer is clear of both bands. A pointer dragged past the edge entirely
 * clamps to the cap rather than falling out of the band, so overshooting the
 * list keeps scrolling instead of stopping dead.
 */
function autoScrollStep(scroller: HTMLElement, clientY: number): number {
  const { top, bottom } = scroller.getBoundingClientRect();
  const speed = (depth: number) =>
    Math.ceil(
      Math.min(1, Math.max(0, AUTOSCROLL_BAND_PX - depth) / AUTOSCROLL_BAND_PX) *
        AUTOSCROLL_MAX_PX_PER_FRAME
    );
  if (clientY < top + AUTOSCROLL_BAND_PX) return -speed(clientY - top);
  if (clientY > bottom - AUTOSCROLL_BAND_PX) return speed(bottom - clientY);
  return 0;
}

/**
 * Reads a motion token off the document so the JavaScript that unmounts an
 * exiting row cannot drift from the CSS that fades it. Never hardcode a
 * duration here - `--dur-exit` in globals.css is the only source.
 */
function durationMs(token: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (raw.endsWith('ms')) return Number.parseFloat(raw) || fallback;
  if (raw.endsWith('s')) return Number.parseFloat(raw) * 1000 || fallback;
  return fallback;
}

export function ImageQueue({
  images,
  selectedId,
  onSelect,
  onRemove,
  onClearAll,
  onReorderImages,
}: ImageQueueProps) {
  const headingId = useId();

  /* --- Row add / remove ---------------------------------------------------
     Travel carries real information in this list - which row arrived and which
     one left. Both are computed during render rather than in an effect: an
     effect runs after the new row has already painted at rest, so the entrance
     would never play. `previousImages` is seeded from the first props, so a
     fresh mount (every time the mobile drawer opens) animates nothing. */
  const [previousImages, setPreviousImages] = useState<ImageFile[]>(images);
  const [enteringIds, setEnteringIds] = useState<readonly string[]>([]);
  const [exitingRows, setExitingRows] = useState<readonly { image: ImageFile; index: number }[]>([]);

  if (previousImages !== images) {
    const previous = previousImages;
    setPreviousImages(images);
    const currentIds = new Set(images.map((image) => image.id));
    const previousIds = new Set(previous.map((image) => image.id));
    const added = images.filter((image) => !previousIds.has(image.id)).map((image) => image.id);
    const removed = previous
      .map((image, index) => ({ image, index }))
      .filter(({ image }) => !currentIds.has(image.id));
    if (added.length > 0) setEnteringIds((current) => [...current, ...added]);
    if (removed.length > 0) setExitingRows((current) => [...current, ...removed]);
  }

  // A row is inserted at its hidden style, then released a frame later so the
  // transition has somewhere to travel from. Two frames, because one is not
  // reliably after the first paint.
  useEffect(() => {
    if (enteringIds.length === 0) return;
    const released = enteringIds;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        setEnteringIds((current) => current.filter((id) => !released.includes(id)));
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [enteringIds]);

  // A removed row stays mounted for exactly one exit duration, then goes.
  useEffect(() => {
    if (exitingRows.length === 0) return;
    const leaving = exitingRows.map((row) => row.image.id);
    const timer = window.setTimeout(() => {
      setExitingRows((current) => current.filter((row) => !leaving.includes(row.image.id)));
    }, durationMs('--dur-exit', 180));
    return () => window.clearTimeout(timer);
  }, [exitingRows]);

  // Live rows, with the leaving ones put back where they were standing.
  const rows: { image: ImageFile; liveIndex: number; leaving: boolean }[] = images.map(
    (image, liveIndex) => ({ image, liveIndex, leaving: false })
  );
  [...exitingRows]
    .sort((a, b) => a.index - b.index)
    .forEach(({ image, index }) => {
      rows.splice(Math.min(index, rows.length), 0, { image, liveIndex: -1, leaving: true });
    });

  /* --- Reorder ------------------------------------------------------------
     Direct manipulation, so Pointer Events throughout and no timed transition
     on anything the hand is moving. One active pointerId, capture taken once
     the press turns into a drag, every event filtered by identity, and both
     `pointercancel` and `lostpointercapture` treated as cancellation.
     `endDrag` is idempotent: pointerup clears the active pointer before the
     implicit capture release fires `lostpointercapture`, so the abort path
     that follows a successful drop does nothing.

     Touch: the grip carries `touch-none`, so a drag started there is never
     stolen by the scroller, while a touch anywhere else on the row scrolls the
     list and the browser cancels the press - which is what a finger expects. */
  const dragRef = useRef<{
    pointerId: number;
    element: HTMLElement;
    fromIndex: number;
    startX: number;
    startY: number;
    // Where the pointer is now. The autoscroll frames below re-hit-test from
    // these while the pointer is held still and the rows move underneath it.
    clientX: number;
    clientY: number;
    moved: boolean;
    imageId: string;
  } | null>(null);
  const dragOverRef = useRef<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndexState] = useState<number | null>(null);

  const setDragOverIndex = useCallback((index: number | null) => {
    dragOverRef.current = index;
    setDragOverIndexState(index);
  }, []);

  /**
   * The destination under a point, or none when the point is off the list.
   *
   * Leaving the list clears the destination, so releasing out there commits
   * nothing - the escape hatch that cancels a drag. Inside the list is not the
   * same thing: the scroller's own padding leaves a gutter at each end with no
   * row in it, and that gutter is exactly where a drag heading for the first or
   * last position comes to rest, doubly so now that holding there is also what
   * scrolls the list. A point inside the box but off a row therefore resolves
   * to the nearer end instead of to nothing.
   */
  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      const indexOf = (element: Element | null | undefined) => {
        const parsed = Number.parseInt(element?.getAttribute('data-drag-index') ?? '', 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const under = document.elementFromPoint(clientX, clientY)?.closest('[data-drag-index]');
      if (under) {
        setDragOverIndex(indexOf(under));
        return;
      }

      const scroller = scrollerRef.current;
      const box = scroller?.getBoundingClientRect();
      if (
        !scroller ||
        !box ||
        clientX < box.left ||
        clientX > box.right ||
        clientY < box.top ||
        clientY > box.bottom
      ) {
        setDragOverIndex(null);
        return;
      }

      const rows = scroller.querySelectorAll('[data-drag-index]');
      setDragOverIndex(indexOf(rows[clientY < box.top + box.height / 2 ? 0 : rows.length - 1]));
    },
    [setDragOverIndex]
  );

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current === null) return;
    cancelAnimationFrame(autoScrollRef.current);
    autoScrollRef.current = null;
  }, []);

  /* Idempotent, and the frame re-arms only while the pointer stays in a band,
     so a drag through the middle of the list costs no frames and a second call
     while already scrolling is a no-op. Unmounting mid-drag clears
     `scrollerRef` and the next frame bails, so there is nothing to tear down
     beyond the `endDrag` funnel. */
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) return;
    const frame = () => {
      autoScrollRef.current = null;
      const drag = dragRef.current;
      const scroller = scrollerRef.current;
      if (!drag || !drag.moved || !scroller) return;

      const step = autoScrollStep(scroller, drag.clientY);
      if (step === 0) return;

      const before = scroller.scrollTop;
      scroller.scrollTop = before + step;
      // The pointer has not moved, but the rows under it have, so the
      // destination is stale until it is read again from the same coordinates.
      if (scroller.scrollTop !== before) hitTest(drag.clientX, drag.clientY);

      autoScrollRef.current = requestAnimationFrame(frame);
    };
    autoScrollRef.current = requestAnimationFrame(frame);
  }, [hitTest]);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    stopAutoScroll();
    if (drag.element.hasPointerCapture(drag.pointerId)) {
      drag.element.releasePointerCapture(drag.pointerId);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [setDragOverIndex, stopAutoScroll]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, image: ImageFile, index: number) => {
      if (!e.isPrimary || e.button !== 0) return;
      if (dragRef.current) return;
      // The remove button owns its own pointer.
      if ((e.target as HTMLElement).closest('button')) return;
      const element = e.currentTarget;
      dragRef.current = {
        pointerId: e.pointerId,
        element,
        fromIndex: index,
        startX: e.clientX,
        startY: e.clientY,
        clientX: e.clientX,
        clientY: e.clientY,
        moved: false,
        imageId: image.id,
      };
      // Capture on press, not on threshold: without it a pointer that leaves
      // the row before moving far enough never delivers its move or up events
      // here, and the press would stay open forever.
      element.setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      if (!drag.moved) {
        const travelled = Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY);
        if (travelled < DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        setDragFromIndex(drag.fromIndex);
        setDragOverIndex(drag.fromIndex);
      }

      drag.clientX = e.clientX;
      drag.clientY = e.clientY;
      hitTest(e.clientX, e.clientY);

      // Held near an edge, the list scrolls under the pointer, so a destination
      // below the fold is reachable without letting go. Started here rather
      // than on every move so the frames only run while a band is occupied.
      const scroller = scrollerRef.current;
      if (scroller && autoScrollStep(scroller, e.clientY) !== 0) {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    },
    [hitTest, setDragOverIndex, startAutoScroll, stopAutoScroll]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      const { moved, fromIndex, imageId } = drag;
      const toIndex = dragOverRef.current;
      endDrag();
      if (!moved) {
        onSelect(imageId);
        return;
      }
      if (toIndex !== null && toIndex !== fromIndex) onReorderImages(fromIndex, toIndex);
    },
    [endDrag, onReorderImages, onSelect]
  );

  const handlePointerAbort = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      endDrag();
    },
    [endDrag]
  );

  useEffect(() => {
    if (dragFromIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Capture phase, and the key is marked handled. A drag can be abandoned
      // with focus anywhere, so this cannot live on the row handler, and
      // `useKeyboardShortcuts` listens on `window` as well - it registered
      // first, so a bubble listener here would let Escape blank the preview
      // before the drag was ever cancelled. Capture runs ahead of every bubble
      // listener on the page, which puts `preventDefault` in place in time for
      // that hook's `defaultPrevented` guard to see it.
      e.preventDefault();
      endDrag();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [dragFromIndex, endDrag]);

  useEffect(() => endDrag, [endDrag]);

  /* --- Keyboard -----------------------------------------------------------
     A single-select listbox with explicit selection: arrows move focus,
     Enter/Space commit. Follow-focus would re-render the preview canvas once
     per row, which makes scanning a long queue expensive.

     `useKeyboardShortcuts` binds the same keys on `window` and skips any event
     that originated inside this listbox, so everything below is the sole
     handler for a focused row. */
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocusRef = useRef<string | null>(null);
  const [lastFocusedId, setLastFocusedId] = useState<string | null>(null);
  const [moveAnnouncement, setMoveAnnouncement] = useState('');

  const registerRow = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) rowRefs.current.set(id, element);
    else rowRefs.current.delete(id);
  }, []);

  useEffect(() => {
    const id = pendingFocusRef.current;
    if (!id) return;
    pendingFocusRef.current = null;
    rowRefs.current.get(id)?.focus();
  }, [images]);

  const focusRowAt = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const image = images[Math.max(0, Math.min(index, images.length - 1))];
      rowRefs.current.get(image.id)?.focus();
    },
    [images]
  );

  /**
   * The keyboard half of drag-to-reorder. `onReorderImages` is a splice-move,
   * and a negative index counts from the end there, so an out-of-range move is
   * not a harmless no-op - Alt+ArrowUp on the first row would send it to the
   * back of the queue. Bounds are checked here, not there.
   */
  const moveRow = useCallback(
    (image: ImageFile, fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= images.length) return;
      // Focus belongs to the image, not to the slot it used to sit in. React
      // moves the keyed row rather than remounting it, but a moved node loses
      // focus in Chrome, so the row is refocused by id once the list settles.
      pendingFocusRef.current = image.id;
      setLastFocusedId(image.id);
      onReorderImages(fromIndex, toIndex);
      setMoveAnnouncement(`${image.name} moved to position ${toIndex + 1} of ${images.length}`);
    },
    [images.length, onReorderImages]
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, image: ImageFile, index: number) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (e.altKey) moveRow(image, index, index + 1);
          else focusRowAt(index + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (e.altKey) moveRow(image, index, index - 1);
          else focusRowAt(index - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusRowAt(0);
          break;
        case 'End':
          e.preventDefault();
          focusRowAt(images.length - 1);
          break;
        case 'Enter':
        case ' ':
          // Cmd/Ctrl+Enter is Process, and it stays global so it works with a
          // row focused. Selecting the row as well would be a second action on
          // one keypress.
          if (e.metaKey || e.ctrlKey) break;
          e.preventDefault();
          onSelect(image.id);
          break;
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          const neighbour = images[index + 1] ?? images[index - 1];
          pendingFocusRef.current = neighbour ? neighbour.id : null;
          onRemove(image.id);
          break;
        }
        default:
          break;
      }
    },
    [focusRowAt, images, moveRow, onRemove, onSelect]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onRemove(id);
    },
    [onRemove]
  );

  // Roving tabindex: the queue is one tab stop. It rides with the row the
  // keyboard last visited - which is what keeps it on an image moved by
  // Alt+Arrow instead of stranding it at the position that image vacated. Until
  // the keyboard has been in the list it lands on the row the canvas is showing.
  const stillPresent = (id: string | null) =>
    id !== null && images.some((image) => image.id === id) ? id : null;
  const tabStopId = stillPresent(lastFocusedId) ?? stillPresent(selectedId) ?? images[0]?.id ?? null;

  // The insertion line. `onReorderImages` pulls the row out before putting it
  // back, so a downward move lands the row BELOW the one under the pointer and
  // an upward move lands it above - the line has to sit where the row will
  // actually come to rest, or it promises a no-op and commits a swap.
  const dropsBelowTarget =
    dragFromIndex !== null && dragOverIndex !== null && dragOverIndex > dragFromIndex;

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        );
      case 'done':
        return (
          <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 id={headingId} className={SECTION_HEADING}>
          Images ({images.length})
        </h3>
        {images.length > 0 && (
          <button
            onClick={onClearAll}
            className={cx(
              'text-xs text-muted px-1 rounded-sm',
              'transition-[color] duration-fast ease-out',
              '[@media(hover:hover)_and_(pointer:fine)]:hover:text-danger',
              'focus-visible:outline-2 focus-visible:outline-offset-2'
            )}
          >
            Clear all
          </button>
        )}
      </div>

      <div
        ref={scrollerRef}
        role="listbox"
        aria-labelledby={headingId}
        className="flex-1 overflow-y-auto scrollbar-thin p-2"
      >
        {rows.map(({ image, liveIndex, leaving }) => {
          const isSelected = !leaving && selectedId === image.id;
          const isEntering = !leaving && enteringIds.includes(image.id);
          const isDragged = !leaving && liveIndex === dragFromIndex;
          const isDropTarget =
            !leaving && liveIndex === dragOverIndex && dragOverIndex !== dragFromIndex;

          return (
            <div
              key={image.id}
              role="presentation"
              aria-hidden={leaving || undefined}
              className={cx(
                'grid transition-[grid-template-rows,opacity,translate]',
                leaving
                  ? 'grid-rows-[0fr] opacity-0 duration-exit ease-in'
                  : 'grid-rows-[1fr] duration-enter ease-out',
                !leaving && (isEntering ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0')
              )}
            >
              <div role="presentation" className={cx('min-h-0', leaving && 'overflow-hidden')}>
                <div role="presentation" className="pb-2">
                  <div
                    ref={
                      leaving
                        ? undefined
                        : (element) => {
                            registerRow(image.id, element);
                          }
                    }
                    data-drag-index={leaving ? undefined : liveIndex}
                    role={leaving ? undefined : 'option'}
                    aria-selected={leaving ? undefined : isSelected}
                    aria-keyshortcuts={leaving ? undefined : 'Delete Alt+ArrowUp Alt+ArrowDown'}
                    tabIndex={leaving ? undefined : image.id === tabStopId ? 0 : -1}
                    onFocus={
                      leaving
                        ? undefined
                        : () => {
                            setLastFocusedId(image.id);
                          }
                    }
                    onPointerDown={
                      leaving ? undefined : (e) => handlePointerDown(e, image, liveIndex)
                    }
                    onPointerMove={leaving ? undefined : handlePointerMove}
                    onPointerUp={leaving ? undefined : handlePointerUp}
                    onPointerCancel={leaving ? undefined : handlePointerAbort}
                    onLostPointerCapture={leaving ? undefined : handlePointerAbort}
                    onKeyDown={leaving ? undefined : (e) => handleRowKeyDown(e, image, liveIndex)}
                    className={cx(
                      'group relative flex items-center gap-3 p-2 rounded-md border select-none',
                      'transition-[background-color,border-color,color] duration-fast ease-out',
                      'focus-visible:outline-2 focus-visible:outline-offset-2',
                      isDragged ? 'cursor-grabbing opacity-40' : 'cursor-pointer',
                      isSelected
                        ? 'bg-surface-selected border-accent-hairline'
                        : cx(
                            'border-transparent',
                            '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover'
                          )
                    )}
                  >
                    {/* Insertion line. Ink rather than accent: this is direct
                        manipulation, so it needs contrast, and the accent
                        budget is spent on the focus ring and Process. */}
                    {isDropTarget && (
                      <span
                        aria-hidden="true"
                        className={cx(
                          'pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-ink',
                          dropsBelowTarget ? '-bottom-1' : '-top-1'
                        )}
                      />
                    )}

                    <div
                      aria-hidden="true"
                      className="flex-shrink-0 text-muted touch-none cursor-grab active:cursor-grabbing"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                      </svg>
                    </div>

                    <div className="relative flex-shrink-0">
                      <img
                        src={image.thumbnailUrl}
                        alt=""
                        className="w-12 h-12 object-cover rounded-sm bg-surface-sunken"
                        draggable={false}
                      />
                      {image.status !== 'pending' && (
                        <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5">
                          {getStatusIcon(image.status)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cx(
                          'text-sm text-ink truncate',
                          isSelected ? 'font-semibold' : 'font-medium'
                        )}
                      >
                        {image.name}
                      </p>
                      <p className="text-xs text-muted data-voice">
                        {image.originalWidth} x {image.originalHeight}
                      </p>
                      {image.error && <p className="text-xs text-danger truncate">{image.error}</p>}
                    </div>

                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => handleRemove(e, image.id)}
                      className={cx(
                        'flex-shrink-0 p-1 rounded-full text-muted',
                        'transition-[opacity,background-color,color] duration-fast ease-out',
                        'focus-visible:outline-2 focus-visible:outline-offset-2',
                        // Visible by default; only a real hovering pointer gets
                        // to hide it, and focus inside the row brings it back.
                        '[@media(hover:hover)_and_(pointer:fine)]:opacity-0',
                        '[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100',
                        '[@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100',
                        '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover',
                        '[@media(hover:hover)_and_(pointer:fine)]:hover:text-danger'
                      )}
                      aria-label={`Remove ${image.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* A keyboard reorder rearranges rows a screen reader user cannot see
          move, and the listbox itself reports no position, so the move is
          spoken here. Mounted empty from the start: a live region that appears
          in the same commit as its text is often missed entirely. Outside the
          listbox, because a listbox may only own options. */}
      <div role="status" aria-live="polite" className="sr-only">
        {moveAnnouncement}
      </div>
    </div>
  );
}
