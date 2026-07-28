import { cx, DISABLED, FOCUS_RING } from './styles';

/**
 * A boolean. The one control in Framr where travel carries the meaning: the
 * knob's position *is* the state, so it moves at `--dur-fast` (SPEC 4.5, fast
 * feedback). Under reduced motion the global rule in globals.css drops
 * `translate` out of the transition list, so the knob jumps to its new position
 * and the colour change still eases - the state stays fully legible.
 *
 * The on-state is surface elevation + an accent hairline + a full-contrast
 * knob, never an accent fill: the accent budget is spent on the focus ring and
 * the single primary action (SPEC 4.3).
 *
 * This renders the control only. Keep your own row layout and visible label,
 * and pass the same words as `label` so assistive tech names it too.
 */

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. Ignored when `labelledBy` is set. */
  label: string;
  /** id of the visible label sitting next to the switch. */
  labelledBy?: string;
  /** `md` (44x24) for a primary row toggle, `sm` (36x20) for a nested one. */
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  labelledBy,
  size = 'md',
  disabled = false,
  className,
  id,
}: SwitchProps) {
  // The track always carries a 1px border so the knob's travel is identical in
  // both states - only the border colour changes.
  const track = size === 'md' ? 'h-6 w-11 p-[3px]' : 'h-5 w-9 p-[1px]';
  const travel = size === 'md' ? 'translate-x-5' : 'translate-x-4';

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'flex flex-none cursor-pointer items-center rounded-full border',
        'transition-[background-color,border-color] duration-fast ease-out',
        FOCUS_RING,
        DISABLED,
        track,
        checked
          ? 'border-accent-hairline bg-surface-selected'
          : 'border-border bg-surface-sunken',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-4 rounded-full',
          // `translate`, not `transform`: Tailwind v4's translate utilities
          // write the `translate` property, so naming `transform` here would
          // animate nothing.
          'transition-[translate,background-color] duration-fast ease-out',
          checked ? cx(travel, 'bg-ink') : 'translate-x-0 bg-muted',
        )}
      />
    </button>
  );
}
