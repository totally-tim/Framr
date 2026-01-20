import type { BorderSettings, ResizeSettings, OutputSettings, ImageFile } from '../types';

export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
export const MAX_PREVIEW_SIZE = 1200;

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidImageType(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type) ||
    /\.(jpe?g|png|tiff?|webp)$/i.test(file.name);
}

export function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

export function getMimeType(format: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
  };
  return types[format.toLowerCase()] || 'image/jpeg';
}

export function getExtensionFromMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/tiff': 'tiff',
  };
  return extensions[mimeType] || 'jpg';
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

export async function createThumbnail(file: File, maxSize: number = 200): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}

export async function createImageFile(file: File): Promise<ImageFile> {
  const img = await loadImage(file);
  const thumbnailUrl = await createThumbnail(file);

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

export function calculateBorderSize(
  imageWidth: number,
  imageHeight: number,
  borderSettings: BorderSettings
): { top: number; right: number; bottom: number; left: number } {
  const { width, widthUnit, aspectAware } = borderSettings;

  let borderSize: number;

  if (widthUnit === '%') {
    const baseSize = Math.min(imageWidth, imageHeight);
    borderSize = Math.round(baseSize * (width / 100));
  } else {
    borderSize = width;
  }

  if (aspectAware) {
    const aspectRatio = imageWidth / imageHeight;
    if (aspectRatio > 1) {
      const verticalBorder = borderSize;
      const horizontalBorder = Math.round(borderSize * aspectRatio);
      return { top: verticalBorder, right: horizontalBorder, bottom: verticalBorder, left: horizontalBorder };
    } else if (aspectRatio < 1) {
      const horizontalBorder = borderSize;
      const verticalBorder = Math.round(borderSize / aspectRatio);
      return { top: verticalBorder, right: horizontalBorder, bottom: verticalBorder, left: horizontalBorder };
    }
  }

  return { top: borderSize, right: borderSize, bottom: borderSize, left: borderSize };
}

export function calculateOutputDimensions(
  originalWidth: number,
  originalHeight: number,
  resizeSettings: ResizeSettings
): { width: number; height: number } {
  if (!resizeSettings.enabled) {
    return { width: originalWidth, height: originalHeight };
  }

  let targetWidth = resizeSettings.width;
  let targetHeight = resizeSettings.height;

  if (resizeSettings.unit === '%') {
    if (targetWidth) targetWidth = Math.round(originalWidth * (targetWidth / 100));
    if (targetHeight) targetHeight = Math.round(originalHeight * (targetHeight / 100));
  }

  if (resizeSettings.maintainAspect) {
    const aspectRatio = originalWidth / originalHeight;

    if (targetWidth && !targetHeight) {
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else if (targetHeight && !targetWidth) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else if (targetWidth && targetHeight) {
      const widthRatio = targetWidth / originalWidth;
      const heightRatio = targetHeight / originalHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      targetWidth = Math.round(originalWidth * ratio);
      targetHeight = Math.round(originalHeight * ratio);
    }
  }

  return {
    width: targetWidth || originalWidth,
    height: targetHeight || originalHeight,
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

export function generateOutputFilename(
  originalName: string,
  outputSettings: OutputSettings
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  let extension: string;

  if (outputSettings.format === 'original') {
    extension = getFileExtension(originalName);
  } else {
    extension = outputSettings.format === 'jpeg' ? 'jpg' : outputSettings.format;
  }

  return `${baseName}_bordered.${extension}`;
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
