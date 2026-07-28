import { useEffect, useRef, useState } from 'react';
import type { Toast as ToastType, ToastVariant } from '../types';
import { useMountThroughExit } from './motion';
import { cx } from './ui';

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;

/**
 * A toast is a raised surface, never a coloured slab. The old variant styles
 * introduced green/red/blue/amber fills that existed nowhere else in the app;
 * the chrome palette has exactly two status tokens, and success has none on
 * purpose (SPEC 4.5: success is silent). So the surface stays neutral and the
 * variant speaks through the hairline and the icon - which also keeps the
 * message at full `text-ink` contrast instead of low-contrast coloured text on
 * a coloured fill.
 */
const VARIANT_RULE: Record<ToastVariant, string> = {
  error: 'border-danger',
  warning: 'border-warning',
  success: 'border-border',
  info: 'border-border',
};

const VARIANT_TONE: Record<ToastVariant, string> = {
  error: 'text-danger',
  warning: 'text-warning',
  success: 'text-muted',
  info: 'text-muted',
};

const VARIANT_ICONS = {
  success: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  // A toast asks to be dismissed; it does not vanish on request. `dismissed`
  // starts the exit, and the shared machine keeps the element mounted for
  // exactly one exit before `mounted` drops and the parent is told to drop it.
  // Both dismissal paths - the timer and the button - go through this one flag,
  // so a hand-dismissed toast animates out the same way an expired one does.
  const [dismissed, setDismissed] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { mounted, shown } = useMountThroughExit(!dismissed, rowRef);

  useEffect(() => {
    if (dismissed) return;
    const timer = window.setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismissed]);

  useEffect(() => {
    if (mounted) return;
    onRemove(toast.id);
  }, [mounted, onRemove, toast.id]);

  if (!mounted) return null;

  return (
    // Entrance runs as a transition, not a keyframe: a toast lands on top of a
    // stack that is already on screen, so a full-height slide would travel
    // straight through the toast below it. An 8px lift plus a fade still reads
    // as "arrived from the bottom edge" without occluding anything, and the row
    // is already at full height, so nothing below it moves.
    //
    // The exit reverses that and collapses the row with it - the same
    // `grid-template-rows: 1fr -> 0fr` the image queue uses for a leaving row.
    // Without the collapse the toasts above this one would hold position for
    // the whole exit and then snap down at unmount. Under reduced motion the
    // global block drops `grid-template-rows` and `translate` from the list, so
    // the toast fades out in place and the stack closes up instantly.
    <div
      ref={rowRef}
      className={cx(
        'grid w-full max-w-xs transition-[grid-template-rows,opacity,translate]',
        dismissed
          ? 'grid-rows-[0fr] translate-y-2 opacity-0 duration-exit ease-in'
          : cx(
              'grid-rows-[1fr] duration-enter ease-out',
              shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
            ),
      )}
    >
      {/* Clipped only while collapsing: a permanent clip would cut the focus
          ring off the dismiss button. */}
      <div className={cx('min-h-0', dismissed && 'overflow-hidden')}>
        {/* The stack's gap lives here, inside the collapsing track, so it
            collapses with the toast instead of leaving 8px behind. */}
        <div className="pt-2">
          <div
            className={cx(
              'pointer-events-auto flex items-center gap-3 rounded-lg border',
              'bg-surface-raised px-4 py-3 text-ink shadow-lg dark:shadow-none',
              VARIANT_RULE[toast.variant],
            )}
            // Only a failure interrupts. Everything else reports.
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <span className={cx('flex shrink-0', VARIANT_TONE[toast.variant])} aria-hidden="true">
              {VARIANT_ICONS[toast.variant]}
            </span>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className={cx(
                'shrink-0 cursor-pointer rounded-sm text-muted',
                'transition-[color] duration-fast ease-out',
                '[@media(hover:hover)_and_(pointer:fine)]:hover:text-ink',
                'focus-visible:outline-2 focus-visible:outline-offset-2',
              )}
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    // `flex-col-reverse` is load-bearing, not cosmetic. The stack is pinned to
    // the bottom of the viewport, so whichever toast sits last in the flex order
    // owns the fixed corner position and never moves. Reversing puts the OLDEST
    // there and grows new arrivals upward, so an existing toast stays exactly
    // where the user found it. DOM order stays chronological for assistive tech.
    //
    // The mobile offset clears the fixed action bar: at `bottom-4` a toast
    // covers the Process button, which is the one control a failure toast most
    // needs the user to reach.
    //
    // No `gap` here on purpose: a flex gap survives a collapsing row, so an
    // exiting toast would leave an 8px hole and close it with a jump. Each row
    // carries its own leading space instead, inside the part that collapses.
    // In `flex-col-reverse` that space sits physically above the row, so the
    // oldest toast still owns the fixed corner with nothing under it.
    <div className="fixed bottom-24 md:bottom-4 right-4 left-4 md:left-auto z-50 flex flex-col-reverse items-center md:items-end pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
