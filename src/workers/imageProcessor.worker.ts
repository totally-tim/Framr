import type { BorderSettings, ResizeSettings, OutputSettings } from '../types';
import {
  calculateBorderSize,
  calculateOutputDimensions,
  getFileExtension,
  getMimeType,
  generateOutputFilename,
} from '../utils/imageProcessing';

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
