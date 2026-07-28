import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { TextPosition } from '../../types';
import { POSITION_OPTIONS } from './positions';
import {
  cx,
  DISABLED,
  FOCUS_RING_INSET,
  HOVER_INK,
  HOVER_SURFACE,
  TRANSITION_SURFACE,
} from './styles';

/**
 * The 3x3 spatial picker. Kept separate from Segment on purpose: the cells
 * carry a position in two dimensions, so the arrow keys have to move in two
 * dimensions, and moving off an edge clamps rather than wraps - "up" from the
 * top row has nowhere to go, and wrapping to the bottom would lie about the
 * geometry.
 *
 * The nine cells are direct children of the radiogroup with no row wrappers,
 * so the containment assistive tech expects is intact.
 */

const COLUMNS = 3;

export interface PositionGridProps {
  value: TextPosition;
  onChange: (value: TextPosition) => void;
  /** Names the group for assistive tech. Ignored when `labelledBy` is set. */
  label: string;
  /** id of a visible label, when one already exists next to the control. */
  labelledBy?: string;
  disabled?: boolean;
  /** Extra classes for the well. Layout only. */
  className?: string;
}

export function PositionGrid({
  value,
  onChange,
  label,
  labelledBy,
  disabled = false,
  className,
}: PositionGridProps) {
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = POSITION_OPTIONS.findIndex((option) => option.value === value);
  const tabbableIndex = disabled ? -1 : Math.max(selectedIndex, 0);

  const select = (index: number) => {
    // Focus synchronously - programmatic focus works on tabindex="-1", so it
    // does not have to wait for the roving index to re-render.
    cellRefs.current[index]?.focus();
    const option = POSITION_OPTIONS[index];
    if (option && option.value !== value) onChange(option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focused = cellRefs.current.indexOf(event.target as HTMLButtonElement);
    const from = focused >= 0 ? focused : Math.max(selectedIndex, 0);
    const row = Math.floor(from / COLUMNS);
    const column = from % COLUMNS;

    // Clamped, not wrapped: the cells mean something spatial.
    const clamp = (n: number) => Math.min(Math.max(n, 0), COLUMNS - 1);
    let next = from;

    switch (event.key) {
      case 'ArrowLeft':
        next = row * COLUMNS + clamp(column - 1);
        break;
      case 'ArrowRight':
        next = row * COLUMNS + clamp(column + 1);
        break;
      case 'ArrowUp':
        next = clamp(row - 1) * COLUMNS + column;
        break;
      case 'ArrowDown':
        next = clamp(row + 1) * COLUMNS + column;
        break;
      case 'Home':
        next = event.ctrlKey ? 0 : row * COLUMNS;
        break;
      case 'End':
        next = event.ctrlKey ? POSITION_OPTIONS.length - 1 : row * COLUMNS + COLUMNS - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    // Selection follows focus, so an arrow key produces exactly the state
    // change a click produces.
    select(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
      className={cx(
        // No overflow-hidden: it would clip the focus ring of the cell inside.
        'grid w-fit grid-cols-3 gap-1 rounded-md bg-surface-sunken p-1',
        className,
      )}
    >
      {POSITION_OPTIONS.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              cellRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.name}
            title={option.name}
            disabled={disabled}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
            className={cx(
              'flex h-8 w-10 cursor-pointer items-center justify-center',
              // text-micro carries its own tracking - never add tracking-wide.
              'rounded-sm border text-micro',
              TRANSITION_SURFACE,
              FOCUS_RING_INSET,
              DISABLED,
              selected
                ? 'border-accent-hairline bg-surface-selected font-semibold text-ink'
                : cx(
                    'border-transparent bg-transparent font-medium text-muted',
                    !disabled && HOVER_SURFACE,
                    !disabled && HOVER_INK,
                  ),
            )}
          >
            {option.abbr}
          </button>
        );
      })}
    </div>
  );
}
