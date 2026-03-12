import type { AspectRatio, BorderSettings, ResizeSettings, OutputSettings } from '../types';

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

/**
 * Calculate border sizes needed to fill an image to a target aspect ratio.
 * Borders are added only on the sides that need expanding (left/right or top/bottom).
 */
export function calculateAspectRatioBorders(
  imageWidth: number,
  imageHeight: number,
  targetRatio: AspectRatio,
): { top: number; right: number; bottom: number; left: number } {
  const srcRatio = imageWidth / imageHeight;
  const tgtRatio = targetRatio.width / targetRatio.height;

  if (Math.abs(srcRatio - tgtRatio) < 0.001) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  if (srcRatio < tgtRatio) {
    // Image is narrower than target: add left/right borders
    const targetWidth = Math.round(imageHeight * tgtRatio);
    const extra = targetWidth - imageWidth;
    const side = Math.floor(extra / 2);
    return { top: 0, right: extra - side, bottom: 0, left: side };
  } else {
    // Image is shorter than target: add top/bottom borders
    const targetHeight = Math.round(imageWidth / tgtRatio);
    const extra = targetHeight - imageHeight;
    const side = Math.floor(extra / 2);
    return { top: side, right: 0, bottom: extra - side, left: 0 };
  }
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
