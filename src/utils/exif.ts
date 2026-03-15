import exifr from 'exifr';

export async function extractExifDate(file: File): Promise<Date | null> {
  try {
    const exif = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
    return exif?.DateTimeOriginal ?? exif?.CreateDate ?? null;
  } catch {
    return null;
  }
}
