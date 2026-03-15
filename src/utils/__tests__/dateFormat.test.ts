import { describe, it, expect } from 'vitest';
import { formatDateStamp } from '../dateFormat';

describe('formatDateStamp', () => {
  const date = new Date(1990, 11, 25); // Dec 25, 1990

  it('formats japanese style', () => {
    expect(formatDateStamp(date, 'japanese')).toBe("'90 12 25");
  });

  it('formats american style', () => {
    expect(formatDateStamp(date, 'american')).toBe('12/25/1990');
  });

  it('formats european style', () => {
    expect(formatDateStamp(date, 'european')).toBe('25.12.1990');
  });

  it('pads single-digit month and day', () => {
    const jan1 = new Date(2024, 0, 5); // Jan 5
    expect(formatDateStamp(jan1, 'japanese')).toBe("'24 01 05");
    expect(formatDateStamp(jan1, 'american')).toBe('01/05/2024');
    expect(formatDateStamp(jan1, 'european')).toBe('05.01.2024');
  });

  it('handles Dec 31', () => {
    const dec31 = new Date(2023, 11, 31);
    expect(formatDateStamp(dec31, 'japanese')).toBe("'23 12 31");
  });

  it('handles year 2000', () => {
    const y2k = new Date(2000, 0, 1);
    expect(formatDateStamp(y2k, 'japanese')).toBe("'00 01 01");
  });
});
