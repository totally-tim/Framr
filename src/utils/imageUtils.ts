import type { BorderSettings, ResizeSettings, OutputSettings, ImageFile } from '../types';

// Re-export shared utilities for convenience
export {
  getFileExtension,
  getMimeType,
  getExtensionFromMime,
  calculateBorderSize,
  calculateOutputDimensions,
  generateOutputFilename,
} from './imageProcessing';

import { getFileExtension, getMimeType, calculateBorderSize, calculateOutputDimensions } from './imageProcessing';

export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
export const MAX_PREVIEW_SIZE = 1200;

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidImageType(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type) ||
    /\.(jpe?g|png|tiff?|webp)$/i.test(file.name);
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
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
          // Fallback to data URL if blob creation fails
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        }
      },
      'image/jpeg',
      0.7
    );
  });
}

/**
 * Clean up resources associated with an image.
 * Revokes object URLs and clears blob references to help garbage collection.
 */
export function cleanupImageResources(image: ImageFile): void {
  // Revoke thumbnailUrl if it's an object URL (starts with 'blob:')
  if (image.thumbnailUrl && image.thumbnailUrl.startsWith('blob:')) {
    URL.revokeObjectURL(image.thumbnailUrl);
  }
  
  // Clear processedBlob reference to help GC
  if (image.processedBlob) {
    (image as { processedBlob?: Blob }).processedBlob = undefined;
  }
}

/**
 * Clean up resources for multiple images and their associated results.
 */
export function cleanupAllImageResources(
  images: ImageFile[],
  results: { imageId: string; blob: Blob }[]
): void {
  // Clean up image resources
  images.forEach(cleanupImageResources);
  
  // Clear result blob references
  results.forEach(result => {
    (result as { blob?: Blob }).blob = undefined;
  });
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

export function processImageOnCanvas(
  img: HTMLImageElement,
  borderSettings: BorderSettings,
  resizeSettings: ResizeSettings
): HTMLCanvasElement {
  const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
    img.width,
    img.height,
    resizeSettings
  );

  const border = calculateBorderSize(resizedWidth, resizedHeight, borderSettings);

  const canvasWidth = resizedWidth + border.left + border.right;
  const canvasHeight = resizedHeight + border.top + border.bottom;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = borderSettings.color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.drawImage(img, border.left, border.top, resizedWidth, resizedHeight);

  return canvas;
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
