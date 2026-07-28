import type { TextPosition } from '../../types';

export interface PositionOption {
  value: TextPosition;
  /** Two-letter cell label. ALL-CAPS, so it takes `text-micro`. */
  abbr: string;
  /** Spoken name - the abbreviation is not readable aloud. */
  name: string;
}

/**
 * The nine cells of the position picker, row-major: index 0-2 is the top row,
 * 3-5 the middle, 6-8 the bottom. PositionGrid derives its row/column arithmetic
 * from that order, so do not reorder this list.
 */
export const POSITION_OPTIONS: readonly PositionOption[] = [
  { value: 'top-left', abbr: 'TL', name: 'Top left' },
  { value: 'top-center', abbr: 'TC', name: 'Top center' },
  { value: 'top-right', abbr: 'TR', name: 'Top right' },
  { value: 'middle-left', abbr: 'ML', name: 'Middle left' },
  { value: 'middle-center', abbr: 'MC', name: 'Middle center' },
  { value: 'middle-right', abbr: 'MR', name: 'Middle right' },
  { value: 'bottom-left', abbr: 'BL', name: 'Bottom left' },
  { value: 'bottom-center', abbr: 'BC', name: 'Bottom center' },
  { value: 'bottom-right', abbr: 'BR', name: 'Bottom right' },
];
