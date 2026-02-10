import type { BorderSettings, ResizeSettings, OutputSettings } from '../types';

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

export function generateOutputFilename(
  originalName: string,
  outputFormat: string | OutputSettings
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  const format = typeof outputFormat === 'string' ? outputFormat : outputFormat.format;
  let extension: string;

  if (format === 'original') {
    extension = getFileExtension(originalName);
  } else {
    extension = format === 'jpeg' ? 'jpg' : format;
  }

  return `${baseName}_bordered.${extension}`;
}
