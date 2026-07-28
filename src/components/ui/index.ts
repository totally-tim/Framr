/**
 * Framr UI primitives.
 *
 * Four controls covering four jobs. Import from here, never reach into a file
 * directly, and do not hand-roll a fifth idiom - the whole point of this
 * directory is that one job has one control.
 *
 *   Segment       pick one from a small, always-visible set.
 *                 role=radiogroup + aria-checked, roving tabindex, arrow keys,
 *                 Home/End. `width="fill"` when it owns its line,
 *                 `width="hug"` in a toolbar.
 *                 -> border style, width unit, resize unit, text effect,
 *                    font category, preview mode, zoom, font weight.
 *
 *   Chip          one item in a wrapping set. Pass `selected` for a selectable
 *                 chip (aria-pressed); omit it for an action that selects
 *                 nothing and should read as a button.
 *                 ChipGroup carries the set's name.
 *                 -> quick presets, social ratios, Quick Fill.
 *
 *   Switch        a boolean. role=switch + aria-checked. The knob's travel is
 *                 the state.
 *                 -> checkerboard, aspect-aware, resize, maintain aspect,
 *                    text overlay enable, auto contrast, text shadow.
 *
 *   PositionGrid  the 3x3 spatial picker. role=radiogroup, two-dimensional
 *                 arrow keys, clamped at the edges.
 *                 -> text overlay position.
 *
 * Rules every one of them already follows, so you inherit them for free:
 * selection is surface elevation + accent hairline + weight and never an accent
 * fill; colours come only from the tokens in globals.css; transitions enumerate
 * their properties and never touch the focus ring; hover feedback is gated on
 * `(hover: hover) and (pointer: fine)`; and the keyboard produces exactly the
 * state change the pointer produces.
 *
 * Naming: every group takes a `label` (or `labelledBy` pointing at the visible
 * one). It is required because the old hand-rolled controls had no accessible
 * state at all - the blue fill was the entire signal.
 */

export { Segment } from './Segment';
export type { SegmentOption, SegmentProps } from './Segment';

export { Chip, ChipGroup } from './Chip';
export type { ChipProps, ChipGroupProps } from './Chip';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { PositionGrid } from './PositionGrid';
export type { PositionGridProps } from './PositionGrid';
export { POSITION_OPTIONS } from './positions';
export type { PositionOption } from './positions';

export { cx } from './styles';
