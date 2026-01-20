import type { BorderSettings, ResizeSettings, OutputSettings } from '../types';

interface ProcessMessage {
  type: 'process';
  imageBitmap: ImageBitmap;
  config: {
    border: BorderSettings;
    resize: ResizeSettings;
    output: OutputSettings;
  };
  originalFormat: string;
  filename: string;
  imageId: string;
}

interface ResultMessage {
  type: 'result';
  imageId: string;
  blob: Blob;
  filename: string;
}

interface ErrorMessage {
  type: 'error';
  imageId: string;
  error: string;
}

interface ProgressMessage {
  type: 'progress';
  imageId: string;
  progress: number;
}

type WorkerOutMessage = ResultMessage | ErrorMessage | ProgressMessage;

function calculateBorderSize(
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

function calculateOutputDimensions(
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

function getMimeType(format: string): string {
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

function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

function generateOutputFilename(
  originalName: string,
  outputFormat: string
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  let extension: string;

  if (outputFormat === 'original') {
    extension = getFileExtension(originalName);
  } else {
    extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
  }

  return `${baseName}_bordered.${extension}`;
}

async function processImage(message: ProcessMessage): Promise<void> {
  const { imageBitmap, config, originalFormat, filename, imageId } = message;
  const { border: borderSettings, resize: resizeSettings, output: outputSettings } = config;

  try {
    self.postMessage({
      type: 'progress',
      imageId,
      progress: 10,
    } as ProgressMessage);

    const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
      imageBitmap.width,
      imageBitmap.height,
      resizeSettings
    );

    const borderSizes = calculateBorderSize(resizedWidth, resizedHeight, borderSettings);

    const canvasWidth = resizedWidth + borderSizes.left + borderSizes.right;
    const canvasHeight = resizedHeight + borderSizes.top + borderSizes.bottom;

    self.postMessage({
      type: 'progress',
      imageId,
      progress: 30,
    } as ProgressMessage);

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = borderSettings.color;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    self.postMessage({
      type: 'progress',
      imageId,
      progress: 50,
    } as ProgressMessage);

    ctx.drawImage(imageBitmap, borderSizes.left, borderSizes.top, resizedWidth, resizedHeight);

    imageBitmap.close();

    self.postMessage({
      type: 'progress',
      imageId,
      progress: 70,
    } as ProgressMessage);

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

    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality,
    });

    self.postMessage({
      type: 'progress',
      imageId,
      progress: 90,
    } as ProgressMessage);

    const outputFilename = generateOutputFilename(filename, outputSettings.format);

    self.postMessage({
      type: 'result',
      imageId,
      blob,
      filename: outputFilename,
    } as ResultMessage);

  } catch (error) {
    self.postMessage({
      type: 'error',
      imageId,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ErrorMessage);
  }
}

self.onmessage = (event: MessageEvent<ProcessMessage>) => {
  if (event.data.type === 'process') {
    processImage(event.data);
  }
};

export type { WorkerOutMessage, ProcessMessage };
