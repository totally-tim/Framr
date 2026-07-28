import { useEffect, useId, useRef } from 'react';
import { useMountThroughExit } from './motion';
import { SECTION_HEADING } from './typography';
import { cx } from './ui';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Candidates for the tab cycle, before the two filters below narrow them. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

/**
 * What Tab can actually reach inside the panel, in document order.
 *
 * `tabIndex >= 0` is read off the element rather than matched in the selector:
 * the queue's remove buttons and its non-current rows all carry
 * `tabindex="-1"`, and a `button[tabindex="-1"]` still satisfies `button`, so a
 * selector-only exclusion leaves them in the list. That put an unreachable
 * button last, the wrap never fired on the real last stop, and Tab walked
 * straight out of the drawer. Zero-box elements go too, so a collapsed section
 * cannot become an invisible stop.
 */
function focusableWithin(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && element.getClientRects().length > 0,
  );
}

export function MobileDrawer({ isOpen, onClose, title, children }: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // The shared disclosure state machine. `panelRef` is the element the timers
  // are read from, so it has to be the panel and not the wrapper: the panel is
  // what declares `transition-[translate,opacity]`, and the backdrop beside it
  // fades on its own schedule. `settled` goes unused - nothing here clips its
  // content, so there is no permanent overflow to drop once the entrance ends.
  const { mounted: isMounted, shown: isShown } = useMountThroughExit(isOpen, panelRef);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* `aria-modal` is a promise about focus, and the markup alone keeps none of
     it. Focus moves to the panel on open, cannot leave it while open, and goes
     back to whatever opened the drawer on close. The panel rather than its
     first control, so a screen reader reads the dialog and its title before
     announcing a button. */
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement;
    restoreFocusRef.current = opener instanceof HTMLElement ? opener : null;
    // preventScroll: the panel is still sitting a full height below the fold on
    // this frame, and scrolling to it would fight the entrance.
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      const trigger = restoreFocusRef.current;
      restoreFocusRef.current = null;
      // Runs the moment the close is requested, not when the exit finishes:
      // `inert` has already dropped focus to the body by now, and leaving it
      // there for the length of the animation loses the user's place.
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Someone nearer the key already dealt with it - the same protocol the
        // global shortcuts follow (docs/adr/0002). The queue's drag-cancel
        // listens in the CAPTURE phase so it can beat every bubble listener on
        // the page, which means it also beats this one: without the check,
        // Escape during a reorder drag inside the drawer would cancel the drag
        // AND close the drawer.
        if (e.defaultPrevented) return;
        // `useKeyboardShortcuts` listens on `window`, one hop further along the
        // bubble path, and its Escape clears the selection. One Escape closes
        // the drawer - it does not also blank the preview behind it.
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = focusableWithin(panel);
      const active = document.activeElement;
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!(active instanceof Node) || !panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      // Backwards off the panel itself wraps too - the panel holds focus right
      // after the drawer opens, and it sits ahead of every control inside it.
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <div
      // While the drawer is exiting it is still full-screen, so it stops
      // swallowing pointer events the moment the close is requested. `inert`
      // does the same for the keyboard, which `pointer-events-none` cannot:
      // without it the close button and the whole queue stay tabbable for the
      // length of the exit, after the drawer has visually gone.
      inert={!isOpen}
      className={cx('fixed inset-0 z-50 md:hidden', !isOpen && 'pointer-events-none')}
    >
      {/* Backdrop. A scrim is always dark, in both themes, so it is the one
          surface the single-token-per-role rule cannot express: `ink` is the
          dark value in light mode and `surface-sunken` is the dark value in
          dark mode. See the report - this wants a `--color-scrim` token. */}
      <div
        className={cx(
          'absolute inset-0 bg-ink/50 dark:bg-surface-sunken/70 transition-opacity',
          isShown ? 'opacity-100 duration-enter ease-out' : 'opacity-0 duration-exit ease-in',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer. Anchored origin: the bottom edge it came from. */}
      <div
        ref={panelRef}
        className={cx(
          'absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-lg',
          'bg-surface-raised shadow-lg dark:shadow-none',
          // `translate`, not `transform`: Tailwind v4's translate utilities
          // write the `translate` property, so naming `transform` here would
          // animate nothing. Enumerated, so no focus ring can be caught in it.
          'transition-[translate,opacity]',
          isShown
            ? 'translate-y-0 opacity-100 duration-enter ease-out'
            : 'translate-y-full opacity-0 duration-exit ease-in',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Programmatic landing spot for focus on open. Not a tab stop, and it
        // carries no focus-visible utility, so no ring is painted on a surface.
        tabIndex={-1}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <h2 id={titleId} className={SECTION_HEADING}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn p-2 -mr-2 text-muted [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
