import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Parses one CSS time value ("0.18s" / "180ms") to milliseconds. */
function toMs(raw: string): number {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.trim().endsWith('ms') ? value : value * 1000;
}

/**
 * The longest transition the element actually declares, read back from the
 * cascade. Every timer below is derived rather than hardcoded so the exit stays
 * pinned to `--dur-exit` in globals.css - no duplicated duration to drift.
 *
 * Reduced motion does not change the answer: the block at the bottom of
 * globals.css re-declares transition-property, never transition-duration, so a
 * surface whose travel was stripped still reports the same length and still
 * fades for it.
 */
export function longestTransitionMs(el: HTMLElement | null): number {
  if (!el) return 0;
  const style = getComputedStyle(el);
  const delays = style.transitionDelay.split(',');
  return style.transitionDuration.split(',').reduce((longest, duration, i) => {
    const total = toMs(duration) + toMs(delays[i % delays.length] ?? '0s');
    return Math.max(longest, total);
  }, 0);
}

/** +50ms of slack so a timer lands after the last painted frame, not on it. */
const SLACK_MS = 50;

/**
 * The state machine every disclosure in this app shares: an accordion, the
 * shortcuts popover, and a toast all need to outlive the moment they are asked
 * to close, or they have no exit at all - they simply vanish, which is what all
 * three used to do.
 *
 * Three flags, because "in the DOM", "in its open position", and "finished
 * arriving" are three different questions:
 *
 *   mounted  render nothing when false. Outlives `open` by exactly one exit.
 *   shown    drives the open/closed class set. False for one painted frame
 *            before an entrance, so the entrance has somewhere to travel from.
 *   settled  the entrance has finished. An accordion clips its content with
 *            `overflow-hidden` until this is true, then stops - a permanent
 *            clip would cut the focus ring off any control inside it.
 *
 * `ref` must point at the element that carries the transition, since the timers
 * are read back from its computed style.
 */
export function useMountThroughExit(open: boolean, ref: RefObject<HTMLElement | null>) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [settled, setSettled] = useState(false);

  // Adjusted during render, which is React's documented way to derive state
  // from a changed prop and the only way to get these onto the same frame as
  // the change itself. Mounting a frame late would swallow the opening frame;
  // holding the open position for a frame after a close was requested would
  // stall the exit before it started. Each condition is self-cancelling, so
  // none of them can loop.
  if (open && !mounted) {
    setMounted(true);
  }
  if (!open && shown) {
    setShown(false);
  }
  if (!open && settled) {
    setSettled(false);
  }

  useEffect(() => {
    if (open) {
      // The closed state has to paint once before the open state can transition
      // away from it, so flip on the frame after the commit. A reopen that
      // interrupts a close never double-mounts - `mounted` was still true - and
      // the running transition simply retargets from wherever it sits.
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }

    const timer = window.setTimeout(
      () => setMounted(false),
      longestTransitionMs(ref.current) + SLACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, ref]);

  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(
      () => setSettled(true),
      longestTransitionMs(ref.current) + SLACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [shown, ref]);

  return { mounted, shown, settled };
}
