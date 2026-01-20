import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { ProcessingResult } from '../types';

export function downloadSingle(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

export async function downloadAsZip(
  results: ProcessingResult[],
  zipFilename: string = 'framr-export.zip',
  onProgress?: (progress: number) => void
): Promise<void> {
  const zip = new JSZip();

  const usedNames = new Set<string>();

  for (const result of results) {
    let filename = result.filename;
    let counter = 1;

    while (usedNames.has(filename)) {
      const baseName = result.filename.replace(/(\.[^.]+)$/, '');
      const extension = result.filename.match(/\.[^.]+$/)?.[0] || '';
      filename = `${baseName}_${counter}${extension}`;
      counter++;
    }

    usedNames.add(filename);
    zip.file(filename, result.blob);
  }

  const content = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) {
        onProgress(metadata.percent);
      }
    }
  );

  saveAs(content, zipFilename);
}

export function generateZipFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 5).replace(':', '');
  return `framr-export-${dateStr}-${timeStr}.zip`;
}
