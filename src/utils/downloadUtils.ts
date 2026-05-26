import { saveAs } from 'file-saver';
import type { ProcessingResult } from '../types';
import { sanitizeOutputBasename } from './imageProcessing';

// `file-saver` is imported statically so single-image downloads run
// synchronously from the click handler — iOS Safari rejects saveAs that
// runs after an awaited microtask boundary (the user-activation flag has
// expired). jszip stays dynamic — it's 95KB gz and only the ZIP path needs it.

export function downloadSingle(blob: Blob, filename: string): void {
  saveAs(blob, sanitizeOutputBasename(filename));
}

export async function downloadAsZip(
  results: ProcessingResult[],
  zipFilename: string = 'framr-export.zip',
  onProgress?: (progress: number) => void,
): Promise<void> {
  const { default: JSZip } = await import('jszip');

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
