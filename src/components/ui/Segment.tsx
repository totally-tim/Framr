import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  cx,
  DISABLED,
  FOCUS_RING_INSET,
  HOVER_INK,
  HOVER_SURFACE,
  TRANSITION_SURFACE,
} from './styles';

/**
 * Pick exactly one from a small, always-visible set.
 *
 * This is the single idiom for that job. It replaces three that used to coexist:
 * the pill-in-track (font category, preview mode, zoom), the full-width bar
 * (border style, width unit, text effect), and the gapped buttons (font
 * weight). Fill-vs-hug is the `width` prop, not a second component.
 *
 * Selection reads as surface elevation + an accent hairline + a heavier weight,
 * never an accent fill (SPEC 4.3). The track is an inset well, so the selected
 * pill rises out of it.
 */

export interface SegmentOption<T extends string | number> {
  value: T;
  /** Visible content. Plain text unless you also pass `ariaLabel`. */
  label: ReactNode;
  /** Tooltip. */
  title?: string;
  /** Accessible name, when `label` is an icon or an abbreviation. */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentProps<T extends string | number> {
  /** The selected value. This alone drives the generic, so `onChange` hands
   *  back your own union type and `options` needs no `as const`. Pass typed
   *  state (`borderSettings.borderMode`, `textOverlay.fontWeight`) - a bare
   *  literal like `value={400}` narrows the generic to that literal and the
   *  other options stop type-checking. */
  value: T;
  options: readonly SegmentOption<NoInfer<T>>[];
  onChange: (value: T) => void;
  /** Names the group for assistive tech. Ignored when `labelledBy` is set. */
  label: string;
  /** id of a visible label, when one already exists next to the control. */
  labelledBy?: string;
  /** `fill` shares the row's width equally between items - use it when the
   *  control owns its own line. `hug` sizes items to their content - use it in
   *  a toolbar or beside other controls. */
  width?: 'fill' | 'hug';
  /** Disables every item. Individual items disable via `option.disabled`. */
  disabled?: boolean;
  /** Extra classes for the track. Layout only - do not restyle the items. */
  className?: string;
}

export function Segment<T extends string | number>({
  value,
  options,
  onChange,
  label,
  labelledBy,
  width = 'fill',
  disabled = false,
  className,
}: SegmentProps<T>) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isDisabled = (index: number) => disabled || Boolean(options[index]?.disabled);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const firstEnabled = options.findIndex((_, index) => !isDisabled(index));
  // A disabled button cannot take focus, so the roving tab stop lands on the
  // selected item only while it is live, otherwise on the first live item. When
  // every item is disabled it is -1 and the group leaves the tab order, which
  // is what a fully disabled control should do.
  const tabbableIndex =
    selectedIndex >= 0 && !isDisabled(selectedIndex) ? selectedIndex : firstEnabled;

  /** Next enabled index in `step` direction, wrapping. -1 if there is none. */
  const nextEnabled = (from: number, step: number) => {
    const count = options.length;
    let index = from;
    for (let i = 0; i < count; i += 1) {
      index = (index + step + count) % count;
      if (!isDisabled(index)) return index;
    }
    return -1;
  };

  const select = (index: number) => {
    if (index < 0) return;
    // Focus synchronously: programmatic focus works on tabindex="-1", so this
    // does not have to wait for the roving index to re-render.
    itemRefs.current[index]?.focus();
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focused = itemRefs.current.indexOf(event.target as HTMLButtonElement);
    const from = focused >= 0 ? focused : selectedIndex;
    if (from < 0) return;

    switch (event.key) {
      // Selection follows focus, so the arrow keys produce exactly the state
      // change a click produces - the radiogroup contract, and the same
      // behaviour as a native radio.
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        select(nextEnabled(from, 1));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        select(nextEnabled(from, -1));
        break;
      case 'Home':
        event.preventDefault();
        select(nextEnabled(-1, 1));
        break;
      case 'End':
        event.preventDefault();
        select(nextEnabled(options.length, -1));
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
      className={cx(
        // No overflow-hidden: it would clip the focus ring of the item inside.
        'flex flex-wrap items-stretch gap-0.5 rounded-md bg-surface-sunken p-0.5',
        width === 'fill' ? 'w-full' : 'w-fit',
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const itemDisabled = isDisabled(index);
        return (
          <button
            key={String(option.value)}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            title={option.title}
            disabled={itemDisabled}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => {
              if (option.value !== value) onChange(option.value);
            }}
            className={cx(
              'flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap',
              'rounded-sm border px-2.5 py-1.5 text-sm',
              TRANSITION_SURFACE,
              FOCUS_RING_INSET,
              DISABLED,
              // `basis-auto`, not `basis-0`: a zero basis lets an item shrink
              // below its own label, and the track never wraps because every
              // hypothetical size is 0 - six font categories in a 260px sidebar
              // then spill their text over each other. With the content width as
              // the basis, a row that cannot fit breaks to a second line and
              // every label stays legible.
              width === 'fill' && 'grow basis-auto',
              selected
                ? 'border-accent-hairline bg-surface-selected font-semibold text-ink'
                : cx(
                    'border-transparent bg-transparent font-medium text-muted',
                    !itemDisabled && HOVER_SURFACE,
                    !itemDisabled && HOVER_INK,
                  ),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
