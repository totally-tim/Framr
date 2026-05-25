export async function extractExifDate(file: File): Promise<Date | null> {
  try {
    const { default: exifr } = await import('exifr');
    const exif = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
    return exif?.DateTimeOriginal ?? exif?.CreateDate ?? null;
  } catch (err) {
    console.warn(`Framr: EXIF parse failed for "${file.name}"`, err);
    return null;
  }
}
