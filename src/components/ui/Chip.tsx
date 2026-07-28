import type { ReactNode } from 'react';
import {
  cx,
  DISABLED,
  FOCUS_RING,
  HOVER_INK,
  HOVER_SURFACE,
  TRANSITION_SURFACE,
} from './styles';

/**
 * One item in a wrapping set - quick presets, social ratios, quick fills.
 *
 * `selected` is the discriminator, and it decides both the semantics and the
 * look:
 *
 *   selected={bool}   selectable chip. Reports `aria-pressed`. Reads as an
 *                     inset chip that rises when active - surface elevation,
 *                     an accent hairline, a heavier weight. Never an accent
 *                     fill (SPEC 4.3).
 *   selected omitted  action chip. No `aria-pressed`, because it toggles
 *                     nothing. Reads as a button: a bordered surface that
 *                     never changes state. This is what the Quick Fill pair
 *                     (Film Camera Date / Today's Date) needs - they fill the
 *                     text field and select nothing.
 *
 * Pass a real boolean only when the chip genuinely has an on/off state. A set
 * of chips that all report "not pressed" is noisier than a set that reports
 * nothing.
 */

export interface ChipProps {
  children: ReactNode;
  onClick: () => void;
  /** Omit for an action chip. See the note above - this is the discriminator. */
  selected?: boolean;
  /** Content before the label: a colour swatch, an icon. */
  leading?: ReactNode;
  /** Tooltip. */
  title?: string;
  /** Accessible name, when `children` is not plain readable text. */
  label?: string;
  disabled?: boolean;
  /** Share the row's width with its siblings, instead of hugging content. */
  fill?: boolean;
  /** Extra classes. Layout only. */
  className?: string;
}

export function Chip({
  children,
  onClick,
  selected,
  leading,
  title,
  label,
  disabled = false,
  fill = false,
  className,
}: ChipProps) {
  const selectable = typeof selected === 'boolean';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      aria-pressed={selectable ? selected : undefined}
      disabled={disabled}
      className={cx(
        'flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap',
        'rounded-md border px-3 py-1.5 text-sm',
        TRANSITION_SURFACE,
        FOCUS_RING,
        DISABLED,
        // `basis-auto`, not `basis-0`: a zero basis lets the chip shrink below
        // its own label and spill the text, and it stops the group wrapping.
        fill && 'grow basis-auto',
        selected === true && 'border-accent-hairline bg-surface-selected font-semibold text-ink',
        selected === false &&
          cx(
            'border-transparent bg-surface-sunken font-medium text-muted',
            !disabled && HOVER_SURFACE,
            !disabled && HOVER_INK,
          ),
        !selectable &&
          cx('border-border bg-surface font-medium text-ink', !disabled && HOVER_SURFACE),
        className,
      )}
    >
      {leading}
      {children}
    </button>
  );
}

export interface ChipGroupProps {
  children: ReactNode;
  /** Names the set for assistive tech. Ignored when `labelledBy` is set. */
  label: string;
  /** id of the visible heading that already names this set. */
  labelledBy?: string;
  className?: string;
}

/**
 * The wrapping row a set of chips lives in. Carries the group name so a screen
 * reader hears which set a chip belongs to - the visible `<h3>` above the row
 * is not otherwise connected to it. Pass its id as `labelledBy`.
 */
export function ChipGroup({ children, label, labelledBy, className }: ChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cx('flex flex-wrap items-center gap-2', className)}
    >
      {children}
    </div>
  );
}
