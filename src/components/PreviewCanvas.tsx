import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { AspectRatio, ImageFile, BorderSettings, ResizeSettings, CanvasBackground, PreviewMode, TextOverlaySettings, ToastVariant } from '../types';
import { loadImage, calculateBorderSize, calculateOutputDimensions } from '../utils/imageUtils';
import { calculateAspectRatioBorders } from '../utils/imageProcessing';
import { applyBorderFill } from '../utils/gradientUtils';
import { drawTextOverlay } from '../utils/textOverlay';
import { useDebounce } from '../hooks/useDebounce';
import { loadFont, isGenericFont } from '../utils/fonts';
import { Segment, cx } from './ui';
import type { SegmentOption } from './ui';

interface PreviewCanvasProps {
  image: ImageFile | null;
  borderSettings: BorderSettings;
  resizeSettings: ResizeSettings;
  canvasBackground: CanvasBackground;
  targetAspectRatio?: AspectRatio;
  textOverlay?: TextOverlaySettings;
  onToast?: (message: string, variant?: ToastVariant) => void;
}

type ZoomLevel = 'fit' | '100' | number;

const PREVIEW_MODES: readonly SegmentOption<PreviewMode>[] = [
  { value: 'processed', label: 'Result' },
  { value: 'original', label: 'Original' },
  {
    value: 'side-by-side',
    // "Side by Side" is the single label that overflows the toolbar below md -
    // at 320px it forces the track onto a second line and the words themselves
    // break across three lines. Both spans live in the DOM but the out-of-range
    // one is display:none, so the accessible name is exactly the text on screen
    // at every width and there is no visible-label / aria-label mismatch.
    label: (
      <>
        <span className="md:hidden">Both</span>
        <span className="hidden md:inline">Side by Side</span>
      </>
    ),
    title: 'Side by side',
  },
  { value: 'slider', label: 'Slider' },
];

const ZOOM_LEVELS: readonly SegmentOption<ZoomLevel>[] = [
  { value: 'fit', label: 'Fit', title: 'Fit to window' },
  // A zoom level is a value the user reads, so it takes the data voice.
  { value: '100', label: <span className="data-voice">100%</span>, title: 'Actual pixels' },
];

/**
 * Quiet icon button. Colours come from tokens, the transition enumerates its
 * properties (`transition-all` is banned, and Tailwind's own
 * `transition-colors` lists `outline-color`, which would drag the focus ring
 * into a transition), and the ring itself is outline-only so it is fully
 * painted on the first frame after focus lands.
 */
const ICON_BUTTON = cx(
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md',
  'text-muted transition-[background-color,border-color,color] duration-fast ease-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-40',
);

/** Hover feedback, gated on a device that actually hovers. */
const HOVER_ICON = cx(
  '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:text-ink',
);

/**
 * The compare handle, its knob, and the two corner captions sit ON the
 * photograph, not on a chrome surface. They are deliberately outside the chrome
 * palette for the same reason `.checkerboard` is: the photograph does not change
 * when the theme does, so a theme-tinted surface would vanish against a dark
 * image in dark mode. Achromatic, fixed, and identical in both themes.
 */
const OVER_IMAGE_PLATE = 'bg-white';
const OVER_IMAGE_CAPTION = 'bg-black/55 text-white';

/**
 * `.checkerboard` paints only its grey diamonds; the empty cells are whatever
 * sits behind the element, which used to be the workspace. Now that the pattern
 * rides on the canvas it carries its own base, so the indicator no longer
 * changes strength with whatever the canvas happens to sit on. Achromatic and
 * fixed for the same reason the pattern is (see the note on `.checkerboard` in
 * globals.css): it indicates transparency, it is not a surface. White and black
 * are the pattern's own extremes, so both themes read harder than they did when
 * the cells fell through to a chrome surface - #e0e0e0 on white is 1.32 against
 * 1.21 before, #333 on black is 1.66 against 1.58.
 */
const CHECKERBOARD = 'checkerboard bg-white dark:bg-black';

export function PreviewCanvas({ image, borderSettings, resizeSettings, canvasBackground, targetAspectRatio, textOverlay, onToast }: PreviewCanvasProps) {
  // Source canvases - always hold Result and Original
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Display canvases for slider mode
  const sliderBgRef = useRef<HTMLCanvasElement>(null);
  const sliderFgRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('processed');
  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    setZoom('fit');
    setSliderPosition(50);
  }, [image?.id]);

  const [isCopying, setIsCopying] = useState(false);

  // Cache decoded image to avoid expensive re-decode on every settings change
  const loadedImageRef = useRef<{ id: string; img: HTMLImageElement } | null>(null);

  // Load custom font into document.fonts so the preview canvas can use it.
  // fontReady counter triggers re-render when font finishes loading.
  const [fontReady, setFontReady] = useState(0);
  useEffect(() => {
    if (!textOverlay?.fontFamily || isGenericFont(textOverlay.fontFamily)) return;
    const weight = textOverlay.fontWeight || 400;
    loadFont(document.fonts, textOverlay.fontFamily, weight).then(() => {
      setFontReady((c) => c + 1);
    });
  }, [textOverlay?.fontFamily, textOverlay?.fontWeight]);

  const debouncedBorderSettings = useDebounce(borderSettings, 80);
  const debouncedResizeSettings = useDebounce(resizeSettings, 80);

  const renderCanvas = useCallback(async (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    borderMode: 'visible' | 'invisible' | 'none',
    containerWidth: number,
    containerHeight: number
  ) => {
    const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
      img.width,
      img.height,
      borderMode !== 'none' ? debouncedResizeSettings : { enabled: false, maintainAspect: true, unit: 'px' }
    );

    let border = { top: 0, right: 0, bottom: 0, left: 0 };
    if (borderMode !== 'none') {
      border = targetAspectRatio
        ? calculateAspectRatioBorders(resizedWidth, resizedHeight, targetAspectRatio)
        : calculateBorderSize(resizedWidth, resizedHeight, debouncedBorderSettings);
    }

    const fullWidth = resizedWidth + border.left + border.right;
    const fullHeight = resizedHeight + border.top + border.bottom;

    let scale: number;
    if (zoom === 'fit') {
      if (fullHeight > fullWidth) {
        // Portrait: fit to width for a larger preview, allow vertical scroll
        scale = Math.min(containerWidth / fullWidth, 1);
      } else {
        scale = Math.min(containerWidth / fullWidth, containerHeight / fullHeight, 1);
      }
    } else if (zoom === '100') {
      scale = 1;
    } else {
      scale = zoom;
    }

    const scaledWidth = Math.round(fullWidth * scale);
    const scaledHeight = Math.round(fullHeight * scale);

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas explicitly
    ctx.clearRect(0, 0, scaledWidth, scaledHeight);

    if (borderMode === 'visible') {
      applyBorderFill(ctx, debouncedBorderSettings, scaledWidth, scaledHeight);
    }

    const imageX = Math.round(border.left * scale);
    const imageY = Math.round(border.top * scale);
    const imageW = Math.round(resizedWidth * scale);
    const imageH = Math.round(resizedHeight * scale);

    ctx.drawImage(img, imageX, imageY, imageW, imageH);

    if (borderMode === 'visible' && textOverlay?.enabled && textOverlay.text.trim()) {
      drawTextOverlay(ctx, scaledWidth, scaledHeight, border, debouncedBorderSettings.color, textOverlay, scale);
    }

    return { scaledWidth, scaledHeight };
  }, [debouncedBorderSettings, debouncedResizeSettings, targetAspectRatio, zoom, textOverlay]);

  const renderPreview = useCallback(async () => {
    if (!image || !containerRef.current) return;

    // For slider mode, check slider refs; for other modes, check resultCanvasRef
    if (previewMode === 'slider') {
      if (!sliderBgRef.current || !sliderFgRef.current) return;
    } else {
      if (!resultCanvasRef.current) return;
    }

    setError(null);

    try {
      // Use cached image when available — only decode on image switch
      let img: HTMLImageElement;
      if (loadedImageRef.current?.id === image.id) {
        img = loadedImageRef.current.img;
      } else {
        setIsLoading(true);
        img = await loadImage(image.file);
        loadedImageRef.current = { id: image.id, img };
      }

      const container = containerRef.current;

      // Reset canvas sizes to get accurate container dimensions
      if (zoom === 'fit') {
        if (previewMode === 'slider') {
          if (sliderBgRef.current) sliderBgRef.current.width = 1;
          if (sliderFgRef.current) sliderFgRef.current.width = 1;
        } else {
          if (resultCanvasRef.current) resultCanvasRef.current.width = 1;
          if (originalCanvasRef.current) originalCanvasRef.current.width = 1;
        }
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }

      let containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;

      if (previewMode === 'side-by-side') {
        containerWidth = (containerWidth - 16) / 2;
      }

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const isComparisonMode = previewMode === 'side-by-side' || previewMode === 'slider';

      if (previewMode === 'slider' && sliderBgRef.current && sliderFgRef.current) {
        // Slider mode: always keep the visible-border rendering on the clipped (top) canvas.
        // This avoids the "visible border bleeding through" when the top canvas has a transparent border.
        await renderCanvas(sliderBgRef.current, img, 'invisible', containerWidth, containerHeight);
        await renderCanvas(sliderFgRef.current, img, 'visible', containerWidth, containerHeight);
      } else if (isComparisonMode && originalCanvasRef.current && resultCanvasRef.current) {
        // Side-by-side mode
        await renderCanvas(resultCanvasRef.current, img, 'visible', containerWidth, containerHeight);
        await renderCanvas(originalCanvasRef.current, img, 'invisible', containerWidth, containerHeight);
      } else if (previewMode === 'original' && resultCanvasRef.current) {
        // Original-only mode, render without border
        await renderCanvas(resultCanvasRef.current, img, 'none', containerWidth, containerHeight);
      } else if (resultCanvasRef.current) {
        // Default (processed) mode
        await renderCanvas(resultCanvasRef.current, img, 'visible', containerWidth, containerHeight);
      }

    } catch (err) {
      setError('Failed to load preview');
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [image, renderCanvas, previewMode, zoom]);

  /* ------------------------------------------------------------------------
     Compare slider - direct manipulation, Pointer Events only.

     One gesture at a time. `activePointerIdRef` holds the id of the pointer
     that owns the drag; every handler drops any event that does not carry that
     id, so a second finger, a stylus resting on the glass, or a mouse button
     pressed mid-touch cannot steer the handle. A second pointer is IGNORED
     rather than treated as a cancel: on a phone the second contact is almost
     always the start of a pinch-zoom or the hand steadying the device, and
     cancelling would snap the handle away from the finger that is still down.

     The container captures the pointer on down, so moves that leave the element
     - or the window - still arrive, which is what the old window-level
     mouseup listener was working around. Capture is lost when the browser takes
     the gesture over (scrolling) or the element goes away, and both
     `pointercancel` and `lostpointercapture` end the drag, so there is no state
     in which the handle stays glued to a pointer that is no longer down.

     No transition anywhere on this path: the handle is one-to-one with the
     hand, and SPEC 4.5 keeps direct manipulation out of reduced motion too.
     ---------------------------------------------------------------------- */
  const activePointerIdRef = useRef<number | null>(null);

  const setPositionFromClientX = useCallback((clientX: number) => {
    const el = sliderContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  /** Idempotent: releasing a capture we no longer hold is a no-op, and a
   *  second call for the same pointer returns at the identity check. */
  const endDrag = useCallback((pointerId: number) => {
    if (activePointerIdRef.current !== pointerId) return;
    activePointerIdRef.current = null;
    const el = sliderContainerRef.current;
    if (el?.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  }, []);

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    // Primary contact, primary button, and no drag already in flight.
    if (!e.isPrimary || e.button !== 0) return;
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer went away between dispatch and handler. The drag still
      // works while the pointer stays over the element, and pointerup or
      // pointercancel still ends it - so carry on rather than throw.
    }
    setPositionFromClientX(e.clientX);
  }, [setPositionFromClientX]);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    setPositionFromClientX(e.clientX);
  }, [setPositionFromClientX]);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    endDrag(e.pointerId);
  }, [endDrag]);

  // pointercancel: the browser took the gesture (a vertical pan won the
  // touch-action race). lostpointercapture: capture went away for any other
  // reason, including the element being removed. Both mean the same thing here.
  const handlePointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    endDrag(e.pointerId);
  }, [endDrag]);

  // Switching preview mode unmounts the drag surface mid-gesture; the effect
  // cleanup drops the active pointer so a later remount never starts captured.
  useEffect(() => {
    if (previewMode !== 'slider') return;
    const el = sliderContainerRef.current;
    return () => {
      const pointerId = activePointerIdRef.current;
      activePointerIdRef.current = null;
      if (pointerId !== null && el?.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    };
  }, [previewMode]);

  const handleHandleKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let next: number | null = null;
    if (e.key === 'ArrowLeft') next = sliderPosition - step;
    else if (e.key === 'ArrowRight') next = sliderPosition + step;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 100;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    setSliderPosition(Math.max(0, Math.min(100, next)));
  }, [sliderPosition]);

  // Clear image cache on unmount
  useEffect(() => {
    return () => {
      loadedImageRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    renderPreview();
  }, [renderPreview, fontReady]);

  useEffect(() => {
    const handleResize = () => {
      if (zoom === 'fit') {
        renderPreview();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoom, renderPreview]);

  const handleCopyToClipboard = useCallback(async () => {
    const canvas = resultCanvasRef.current;
    if (!canvas || !image) return;
    if (!navigator.clipboard?.write) {
      onToast?.('Clipboard not supported in this browser', 'warning');
      return;
    }
    setIsCopying(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create image blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      onToast?.('Image copied to clipboard', 'success');
    } catch {
      onToast?.('Failed to copy image to clipboard', 'error');
    } finally {
      setIsCopying(false);
    }
  }, [image, onToast]);

  if (!image) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center">
        <p className="text-xl text-muted">Select an image to preview</p>
      </div>
    );
  }

  // Determine labels based on swap state
  const leftLabel = swapped ? 'Original' : 'Result';
  const rightLabel = swapped ? 'Result' : 'Original';

  const isComparing = previewMode === 'side-by-side' || previewMode === 'slider';
  const copyDisabled = isCopying || isComparing;

  /* The canvas background is an IMAGE-palette value: it is what the user sees
     through a transparent image and in the transparent border immediately
     around the photograph. So it paints on the canvas elements themselves and
     nowhere else - the gutter they sit in is chrome, and an image colour that
     floods the workspace puts the user's palette on the instrument.
     `.checkerboard` on the canvas box also keeps the tiles aligned to the
     canvas origin and clipped to its bounds. */
  const canvasBackdrop = canvasBackground.mode === 'checkerboard' ? CHECKERBOARD : undefined;
  const canvasBackdropStyle = canvasBackground.mode === 'solid'
    ? { backgroundColor: canvasBackground.color }
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* No transition on this container: a settings change drives a debounced
          re-render and the new pixels are the feedback (SPEC 4.5). */}
      <div
        ref={containerRef}
        // The gutter is chrome, so it takes the inset-well token from the
        // mapping rule in globals.css. The canvas background lives on the
        // canvases themselves (see canvasBackdrop below).
        className="relative flex min-h-0 flex-1 overflow-auto bg-surface-sunken p-4"
        style={{
          alignItems: 'safe center',
          justifyContent: 'safe center',
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            {/* animate-spin is exempted by name from the reduced-motion block in
                globals.css - do not swap it for a custom keyframe. */}
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          </div>
        )}

        {error ? (
          <div className="text-sm text-danger">{error}</div>
        ) : previewMode === 'side-by-side' ? (
          <div className={cx('flex items-center justify-center gap-4', swapped && 'flex-row-reverse')}>
            <div className="flex flex-col items-center">
              <span className="mb-2 whitespace-nowrap text-xs text-muted">Result</span>
              <canvas
                ref={resultCanvasRef}
                className={cx('shadow-lg', canvasBackdrop)}
                style={{ ...canvasBackdropStyle, imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-2 whitespace-nowrap text-xs text-muted">Original</span>
              <canvas
                ref={originalCanvasRef}
                className={cx('shadow-lg', canvasBackdrop)}
                style={{ ...canvasBackdropStyle, imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
              />
            </div>
          </div>
        ) : previewMode === 'slider' ? (
          <div
            ref={sliderContainerRef}
            className="relative cursor-ew-resize select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
            // Narrowest declaration that still leaves the horizontal drag to us:
            // the page keeps vertical panning (portrait previews scroll) and
            // pinch-zoom, and when the browser claims one of those it sends
            // pointercancel, which ends the drag cleanly.
            style={{ touchAction: 'pan-y pinch-zoom' }}
          >
            {/* Background canvas (full size, visible on right) */}
            <canvas
              ref={sliderBgRef}
              className={cx('shadow-lg', canvasBackdrop)}
              style={{ ...canvasBackdropStyle, imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
            />

            {/* Foreground canvas (clipped, visible on left) */}
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={swapped
                ? { left: `${sliderPosition}%`, width: `${100 - sliderPosition}%`, height: '100%' }
                : { left: 0, width: `${sliderPosition}%`, height: '100%' }
              }
            >
              <canvas
                ref={sliderFgRef}
                className={cx('shadow-lg', canvasBackdrop)}
                style={{
                  ...canvasBackdropStyle,
                  imageRendering: zoom === '100' ? 'pixelated' : 'auto',
                  maxWidth: 'none',
                  // The wrapper is offset by sliderPosition% of the container
                  // and the canvas back by the same fraction of its own equal
                  // width, so it lands exactly over the background canvas -
                  // which is what keeps the two backdrops seamless.
                  transform: swapped ? `translateX(-${sliderPosition}%)` : undefined,
                }}
              />
            </div>

            {/* Slider handle. Keyboard-operable: the global shortcut handler
                claims ArrowUp/ArrowDown for queue navigation and leaves the
                horizontal axis free, so left/right (and shift for a coarse
                step) drive the same state a drag does. */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Compare position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sliderPosition)}
              aria-valuetext={`${Math.round(sliderPosition)}%`}
              onKeyDown={handleHandleKeyDown}
              className={cx(
                'absolute top-0 bottom-0 w-1 cursor-ew-resize shadow-lg',
                'focus-visible:outline-2 focus-visible:outline-offset-2',
                OVER_IMAGE_PLATE,
              )}
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={cx(
                  'absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2',
                  'items-center justify-center rounded-full shadow-lg',
                  OVER_IMAGE_PLATE,
                )}
              >
                <svg className="h-4 w-4 text-black/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className={cx('absolute top-2 left-2 rounded-sm px-2 py-1 text-micro whitespace-nowrap', OVER_IMAGE_CAPTION)}>
              {leftLabel}
            </div>
            <div className={cx('absolute top-2 right-2 rounded-sm px-2 py-1 text-micro whitespace-nowrap', OVER_IMAGE_CAPTION)}>
              {rightLabel}
            </div>
          </div>
        ) : (
          <canvas
            ref={resultCanvasRef}
            className={cx('max-w-full shadow-lg', canvasBackdrop)}
            style={{ ...canvasBackdropStyle, imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
          />
        )}
      </div>

      {/* Toolbar. Below md the mode segment owns its own line and everything
          else shares the second one, so nothing clips and no clickable label
          ever wraps. From md up it is a single row again. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-3">
        <Segment
          value={previewMode}
          options={PREVIEW_MODES}
          onChange={setPreviewMode}
          label="Preview mode"
          width="fill"
          className="md:w-fit"
        />

        <div className="flex w-full items-center gap-2 md:ml-auto md:w-auto">
          <span className="data-voice whitespace-nowrap text-xs text-muted">
            {image.originalWidth} × {image.originalHeight}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {isComparing && (
              <button
                type="button"
                onClick={() => setSwapped(!swapped)}
                className={cx(ICON_BUTTON, HOVER_ICON)}
                title="Swap original and result"
                aria-label="Swap original and result"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
                </svg>
              </button>
            )}

            <Segment
              value={zoom}
              options={ZOOM_LEVELS}
              onChange={setZoom}
              label="Zoom"
              width="hug"
            />

            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={copyDisabled}
              title="Copy result to clipboard"
              aria-label="Copy result to clipboard"
              className={cx(ICON_BUTTON, !copyDisabled && HOVER_ICON)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
