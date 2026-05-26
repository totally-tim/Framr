import type { AspectRatio, BorderSettings, ResizeSettings, OutputSettings, TextOverlaySettings } from '../types';
import {
  calculateBorderSize,
  calculateAspectRatioBorders,
  calculateOutputDimensions,
  getFileExtension,
  getMimeType,
  generateOutputFilename,
  resolveEncodableMime,
} from '../utils/imageProcessing';
import { applyBorderFill } from '../utils/gradientUtils';
import { drawTextOverlay } from '../utils/textOverlay';
import { loadFont, isGenericFont } from '../utils/fonts';

interface ProcessMessage {
  type: 'process';
  imageBitmap: ImageBitmap;
  config: {
    border: BorderSettings;
    resize: ResizeSettings;
    output: OutputSettings;
    targetAspectRatio?: AspectRatio;
    textOverlay?: TextOverlaySettings;
  };
  originalFormat: string;
  filename: string;
  imageId: string;
  batchId: string;
  fontData?: ArrayBuffer;
}

interface ResultMessage {
  type: 'result';
  imageId: string;
  batchId: string;
  blob: Blob;
  filename: string;
  fontFallback?: string;
  outputDowngraded?: 'tiff';
}

interface ErrorMessage {
  type: 'error';
  imageId: string;
  batchId: string;
  error: string;
}

interface ProgressMessage {
  type: 'progress';
  imageId: string;
  batchId: string;
  progress: number;
}

type WorkerOutMessage = ResultMessage | ErrorMessage | ProgressMessage;

async function processImage(message: ProcessMessage): Promise<void> {
  const { imageBitmap, config, originalFormat, filename, imageId, batchId } = message;
  const { border: borderSettings, resize: resizeSettings, output: outputSettings, targetAspectRatio, textOverlay } = config;

  let fontFallback: string | undefined;
  let outputDowngraded: 'tiff' | undefined;

  try {
    self.postMessage({ type: 'progress', imageId, batchId, progress: 10 } as ProgressMessage);

    const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
      imageBitmap.width,
      imageBitmap.height,
      resizeSettings,
    );

    const borderSizes = targetAspectRatio
      ? calculateAspectRatioBorders(resizedWidth, resizedHeight, targetAspectRatio)
      : calculateBorderSize(resizedWidth, resizedHeight, borderSettings);

    const canvasWidth = resizedWidth + borderSizes.left + borderSizes.right;
    const canvasHeight = resizedHeight + borderSizes.top + borderSizes.bottom;

    self.postMessage({ type: 'progress', imageId, batchId, progress: 30 } as ProgressMessage);

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d')!;

    applyBorderFill(ctx, borderSettings, canvasWidth, canvasHeight);

    self.postMessage({ type: 'progress', imageId, batchId, progress: 50 } as ProgressMessage);

    ctx.drawImage(imageBitmap, borderSizes.left, borderSizes.top, resizedWidth, resizedHeight);

    if (textOverlay) {
      let effectiveFamily = textOverlay.fontFamily;
      let effectiveWeight = textOverlay.fontWeight || 400;

      if (!isGenericFont(effectiveFamily)) {
        const workerFonts = (self as unknown as { fonts: FontFaceSet }).fonts;
        let loaded = false;

        if (message.fontData) {
          try {
            const face = new FontFace(effectiveFamily, message.fontData, {
              weight: String(effectiveWeight),
            });
            workerFonts.add(face);
            await face.load();
            loaded = true;
          } catch (err) {
            console.warn(`Framr worker: font from ArrayBuffer failed (${effectiveFamily})`, err);
          }
        }

        if (!loaded) {
          loaded = await loadFont(workerFonts, effectiveFamily, effectiveWeight);
        }

        if (!loaded) {
          console.error(`Framr worker: font "${effectiveFamily}" failed, using sans-serif fallback`);
          fontFallback = effectiveFamily;
          effectiveFamily = 'sans-serif';
          effectiveWeight = 400;
        }
      }

      self.postMessage({ type: 'progress', imageId, batchId, progress: 55 } as ProgressMessage);

      drawTextOverlay(ctx, canvasWidth, canvasHeight, borderSizes, borderSettings.color, {
        ...textOverlay,
        fontFamily: effectiveFamily,
        fontWeight: effectiveWeight,
      });
    }

    self.postMessage({ type: 'progress', imageId, batchId, progress: 70 } as ProgressMessage);

    const requestedMime = outputSettings.format === 'original'
      ? getMimeType(getFileExtension(originalFormat))
      : getMimeType(outputSettings.format);

    const { mime, downgradedFrom } = resolveEncodableMime(requestedMime);
    if (downgradedFrom === 'image/tiff') outputDowngraded = 'tiff';

    let quality: number | undefined;
    if (mime === 'image/jpeg' || mime === 'image/webp') {
      quality = outputSettings.quality / 100;
    }

    const blob = await canvas.convertToBlob({ type: mime, quality });

    self.postMessage({ type: 'progress', imageId, batchId, progress: 90 } as ProgressMessage);

    // Derive extension from the MIME we actually encoded with — so a TIFF
    // request that got downgraded to PNG ships as .png, not .tiff.
    const outputFilename = generateOutputFilename(filename, mime);

    self.postMessage({
      type: 'result',
      imageId,
      batchId,
      blob,
      filename: outputFilename,
      fontFallback,
      outputDowngraded,
    } as ResultMessage);

  } catch (error) {
    self.postMessage({
      type: 'error',
      imageId,
      batchId,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ErrorMessage);
  } finally {
    // ALWAYS release the transferred bitmap — even on error paths — to prevent worker-side memory leaks.
    try { imageBitmap.close(); } catch { /* already closed */ }
  }
}

self.onmessage = (event: MessageEvent<ProcessMessage>) => {
  if (event.data.type === 'process') {
    processImage(event.data);
  }
};

self.addEventListener('error', (event) => {
  console.error('Framr worker: unhandled error', event.message, event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Framr worker: unhandled promise rejection', (event as PromiseRejectionEvent).reason);
});

export type { WorkerOutMessage, ProcessMessage };
