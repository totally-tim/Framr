import type { OutputSettings, ImageFile } from '../types';

// Re-export shared utilities for convenience
export {
  getFileExtension,
  getMimeType,
  getExtensionFromMime,
  calculateBorderSize,
  calculateOutputDimensions,
  generateOutputFilename,
} from './imageProcessing';

import { getFileExtension, getMimeType } from './imageProcessing';

export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
export const MAX_PREVIEW_SIZE = 1600;

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function isValidImageType(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type) ||
    /\.(jpe?g|png|tiff?|webp)$/i.test(file.name);
}

export class ImageLoadError extends Error {
  constructor(public readonly file: File, public readonly cause?: unknown) {
    super(`Failed to decode image "${file.name}" (${file.type || 'unknown type'}, ${formatFileSize(file.size)})`);
    this.name = 'ImageLoadError';
  }
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(new ImageLoadError(file, event));
    };

    img.src = url;
  });
}

export function createThumbnail(img: HTMLImageElement, maxSize: number = 200): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          console.warn('Framr: thumbnail toBlob returned null, falling back to data URL');
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        }
      },
      'image/jpeg',
      0.7
    );
  });
}

export function cleanupImageResources(image: ImageFile): void {
  if (image.thumbnailUrl && image.thumbnailUrl.startsWith('blob:')) {
    URL.revokeObjectURL(image.thumbnailUrl);
  }
}

export function cleanupAllImageResources(images: ImageFile[]): void {
  images.forEach(cleanupImageResources);
}

export async function createImageFile(file: File): Promise<ImageFile> {
  const img = await loadImage(file);
  const thumbnailUrl = await createThumbnail(img);

  return {
    id: generateId(),
    file,
    name: file.name,
    originalWidth: img.width,
    originalHeight: img.height,
    thumbnailUrl,
    status: 'pending',
  };
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputSettings: OutputSettings,
  originalFormat: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let mimeType: string;
    let quality: number | undefined;

    if (outputSettings.format === 'original') {
      mimeType = getMimeType(getFileExtension(originalFormat));
    } else {
      mimeType = getMimeType(outputSettings.format);
    }

    if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
      quality = outputSettings.quality / 100;
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function estimateMemoryUsage(width: number, height: number): number {
  return width * height * 4;
}

export function checkMemoryWarning(images: ImageFile[]): boolean {
  const totalPixels = images.reduce((sum, img) => {
    return sum + (img.originalWidth * img.originalHeight);
  }, 0);

  const estimatedMemory = totalPixels * 4 * 2;
  return estimatedMemory > 500 * 1024 * 1024;
}
