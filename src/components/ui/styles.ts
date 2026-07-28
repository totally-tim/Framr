/**
 * Shared class-name fragments for the ui primitives.
 *
 * Every literal here is a complete Tailwind class name so the `@source` scan in
 * globals.css can find it. Never build one of these by concatenation - a class
 * assembled at runtime is never generated.
 */

/** Joins class fragments, dropping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Hover feedback, gated on a device that actually hovers. SPEC 4.5: hover is
 * never the only path to a control, and a touch device must not latch a hover
 * state after a tap. Tailwind v4's own `hover:` variant only checks
 * `(hover: hover)`, so these spell out the full query.
 */
export const HOVER_SURFACE =
  '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover';
export const HOVER_INK =
  '[@media(hover:hover)_and_(pointer:fine)]:hover:text-ink';

/**
 * Focus ring. Colour comes from the global `outline-color: var(--color-focus)`
 * rule in globals.css, so focus only ever switches outline-style and
 * outline-width - both unanimatable. It is never named in a transition
 * property list anywhere in this directory, so it is fully visible on the first
 * frame after focus lands.
 */
export const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2';
/** Same ring, pulled in 1px for items sitting inside a track or well. */
export const FOCUS_RING_INSET = 'focus-visible:outline-2 focus-visible:outline-offset-1';

/**
 * Colour-only transition, enumerated. `transition-all` is banned, and
 * `transition-colors` is avoided on purpose: its v4 property list includes
 * `outline-color`, which would put the focus ring inside a transition.
 */
export const TRANSITION_SURFACE =
  'transition-[background-color,border-color,color] duration-fast ease-out';

/** The disabled treatment shared with `.btn` in globals.css. */
export const DISABLED = 'disabled:cursor-not-allowed disabled:opacity-50';
