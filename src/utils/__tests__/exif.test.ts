import { describe, it, expect, vi } from 'vitest';

// Mock exifr before importing extractExifDate
vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

import { extractExifDate } from '../exif';
import exifr from 'exifr';

describe('extractExifDate', () => {
  it('returns DateTimeOriginal when available', async () => {
    const date = new Date(2023, 5, 15);
    vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: date });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await extractExifDate(file);
    expect(result).toBe(date);
  });

  it('falls back to CreateDate when DateTimeOriginal is missing', async () => {
    const date = new Date(2023, 5, 15);
    vi.mocked(exifr.parse).mockResolvedValue({ CreateDate: date });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await extractExifDate(file);
    expect(result).toBe(date);
  });

  it('returns null when no EXIF data', async () => {
    vi.mocked(exifr.parse).mockResolvedValue(null);

    const file = new File([''], 'test.png', { type: 'image/png' });
    const result = await extractExifDate(file);
    expect(result).toBeNull();
  });

  it('returns null on parse error (corrupt EXIF)', async () => {
    vi.mocked(exifr.parse).mockRejectedValue(new Error('corrupt'));

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await extractExifDate(file);
    expect(result).toBeNull();
  });
});
