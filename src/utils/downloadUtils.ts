import type { ProcessingResult } from '../types';
import { sanitizeOutputBasename } from './imageProcessing';

export async function downloadSingle(blob: Blob, filename: string): Promise<void> {
  const { saveAs } = await import('file-saver');
  saveAs(blob, sanitizeOutputBasename(filename));
}

export async function downloadAsZip(
  results: ProcessingResult[],
  zipFilename: string = 'framr-export.zip',
  onProgress?: (progress: number) => void,
): Promise<void> {
  const [{ default: JSZip }, { saveAs }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
  ]);

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const result of results) {
    const safeBase = sanitizeOutputBasename(result.filename);
    let filename = safeBase;
    let counter = 1;

    while (usedNames.has(filename)) {
      const stem = safeBase.replace(/(\.[^.]+)$/, '');
      const extension = safeBase.match(/\.[^.]+$/)?.[0] || '';
      filename = `${stem}_${counter}${extension}`;
      counter++;
    }

    usedNames.add(filename);
    zip.file(filename, result.blob);
  }

  const content = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) onProgress(metadata.percent);
    },
  );

  saveAs(content, zipFilename);
}

export function generateZipFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 5).replace(':', '');
  return `framr-export-${dateStr}-${timeStr}.zip`;
}
