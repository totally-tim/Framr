import { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageFile, ProcessingConfig, ProcessingResult } from '../types';
import { fetchFontData, isGenericFont } from '../utils/fonts';

interface ProcessingState {
  isProcessing: boolean;
  currentIndex: number;
  totalCount: number;
  progress: number;
  currentImageName: string;
  results: ProcessingResult[];
  cancelled: boolean;
}

export type ProcessRejectionReason = 'busy' | 'no-worker' | 'no-images';

const IMAGE_TIMEOUT_MS = 90_000;

interface PendingHandler {
  reject: (err: Error) => void;
  cleanup: () => void;
  batchId: string;
}

function createWorker(): Worker {
  return new Worker(
    new URL('../workers/imageProcessor.worker.ts', import.meta.url),
    { type: 'module' },
  );
}

export function useImageProcessor() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    currentIndex: 0,
    totalCount: 0,
    progress: 0,
    currentImageName: '',
    results: [],
    cancelled: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const cancelledRef = useRef(false);
  const isProcessingRef = useRef(false);
  const currentBatchIdRef = useRef<string>('');
  const pendingHandlersRef = useRef<Set<PendingHandler>>(new Set());
  const fontFallbackToastRef = useRef<((msg: string) => void) | null>(null);

  // Reject every pending handler and force a fresh worker on next call.
  // Used by both onerror (uncaught exception) and onmessageerror
  // (deserialization failure) — both leave handlers stuck otherwise.
  const drainAndRecycleWorker = useCallback((reason: string) => {
    const pending = Array.from(pendingHandlersRef.current);
    pendingHandlersRef.current.clear();
    for (const handler of pending) {
      handler.cleanup();
      handler.reject(new Error(reason));
    }
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  // Recreate the worker lazily so a StrictMode teardown doesn't leave us with a terminated worker.
  const ensureWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const worker = createWorker();
      worker.onerror = (event) => {
        console.error('Framr: worker error', event.message, event);
        drainAndRecycleWorker(`Worker crashed: ${event.message || 'unknown error'}`);
      };
      worker.onmessageerror = (event) => {
        console.error('Framr: worker messageerror (structured-clone failed)', event);
        // messageerror means the runtime couldn't deserialize a message —
        // the pending handler for that image will never see a result, so
        // we must reject pending handlers and recycle the worker, same as
        // an onerror crash.
        drainAndRecycleWorker('Worker message could not be deserialized');
      };
      workerRef.current = worker;
    }
    return workerRef.current;
  }, [drainAndRecycleWorker]);

  useEffect(() => {
    ensureWorker();
    return () => {
      // Mirror cancel semantics: reject in-flight handlers + clear their
      // timers, then terminate the worker. Without this, any in-flight
      // processImages promise stays pending until its 90s timeout fires —
      // timers keep running and stale state updates fire post-unmount.
      drainAndRecycleWorker('Component unmounted');
    };
  }, [ensureWorker, drainAndRecycleWorker]);

  const processImages = useCallback(
    async (
      images: ImageFile[],
      config: ProcessingConfig,
      onImageComplete?: (imageId: string, result: ProcessingResult) => void,
      onImageError?: (imageId: string, error: string) => void,
      onWarning?: (message: string) => void,
    ): Promise<{ results: ProcessingResult[]; rejected?: ProcessRejectionReason }> => {
      if (images.length === 0) {
        return { results: [], rejected: 'no-images' };
      }
      if (isProcessingRef.current) {
        return { results: [], rejected: 'busy' };
      }

      const batchId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `batch-${Date.now()}-${Math.random()}`;

      isProcessingRef.current = true;
      cancelledRef.current = false;
      currentBatchIdRef.current = batchId;
      fontFallbackToastRef.current = onWarning ?? null;

      setState({
        isProcessing: true,
        currentIndex: 0,
        totalCount: images.length,
        progress: 0,
        currentImageName: images[0]?.name ?? '',
        results: [],
        cancelled: false,
      });

      const results: ProcessingResult[] = [];

      // Pre-fetch font data once for the entire batch.
      let fontData: ArrayBuffer | null = null;
      if (
        !cancelledRef.current &&
        config.textOverlay?.enabled &&
        config.textOverlay.fontFamily &&
        !isGenericFont(config.textOverlay.fontFamily)
      ) {
        fontData = await fetchFontData(
          config.textOverlay.fontFamily,
          config.textOverlay.fontWeight || 400,
        );
        if (!fontData && config.textOverlay.fontFamily !== 'sans-serif') {
          onWarning?.(
            `Couldn't load font "${config.textOverlay.fontFamily}" — falling back to system sans-serif.`,
          );
        }
      }

      const reportedFontFallback = { current: false };

      try {
        for (let i = 0; i < images.length; i++) {
          if (cancelledRef.current) break;

          const image = images[i];

          setState((prev) => ({
            ...prev,
            currentIndex: i,
            progress: (i / images.length) * 100,
            currentImageName: image.name,
          }));

          try {
            const bitmap = await createImageBitmap(image.file);
            // Re-acquire the worker each iteration — a crash (onerror /
            // onmessageerror) recycles workerRef.current to null, and the
            // remaining images need to post to the *new* worker, not the
            // dead handle captured at the top of the batch.
            const worker = ensureWorker();

            const result = await new Promise<ProcessingResult>((resolve, reject) => {
              let timeoutId: ReturnType<typeof setTimeout> | null = null;

              const handler = (event: MessageEvent) => {
                const data = event.data;
                if (data.batchId !== batchId) return;
                if (data.imageId !== image.id) return;

                if (data.type === 'result') {
                  cleanup();
                  if (data.fontFallback && !reportedFontFallback.current) {
                    reportedFontFallback.current = true;
                    onWarning?.(`Font fallback used (${data.fontFallback}); output may differ from preview.`);
                  }
                  if (data.outputDowngraded && data.outputDowngraded === 'tiff') {
                    onWarning?.(
                      `TIFF output isn't supported in this browser — saving "${image.name}" as PNG instead.`,
                    );
                  }
                  resolve({
                    imageId: data.imageId,
                    blob: data.blob,
                    filename: data.filename,
                  });
                } else if (data.type === 'error') {
                  cleanup();
                  reject(new Error(data.error));
                } else if (data.type === 'progress') {
                  const imageProgress = data.progress;
                  const overallProgress = ((i + imageProgress / 100) / images.length) * 100;
                  setState((prev) => ({ ...prev, progress: overallProgress }));
                }
              };

              const pending: PendingHandler = {
                reject,
                cleanup: () => cleanup(),
                batchId,
              };

              const cleanup = (): void => {
                worker.removeEventListener('message', handler);
                if (timeoutId) clearTimeout(timeoutId);
                pendingHandlersRef.current.delete(pending);
              };

              pendingHandlersRef.current.add(pending);
              worker.addEventListener('message', handler);

              timeoutId = setTimeout(() => {
                cleanup();
                // The worker is still grinding on the stuck job — workers
                // process messages serially, so the next image would queue
                // behind it and cascade into more timeouts. Recycle so the
                // next iteration's ensureWorker spins up a fresh worker.
                drainAndRecycleWorker(`Processing timed out after ${IMAGE_TIMEOUT_MS / 1000}s`);
                reject(new Error(`Processing timed out after ${IMAGE_TIMEOUT_MS / 1000}s`));
              }, IMAGE_TIMEOUT_MS);

              const fontDataCopy = fontData ? fontData.slice(0) : undefined;
              const transferables: Transferable[] = [bitmap];
              if (fontDataCopy) transferables.push(fontDataCopy);

              try {
                worker.postMessage({
                  type: 'process',
                  imageBitmap: bitmap,
                  config,
                  originalFormat: image.name,
                  filename: image.name,
                  imageId: image.id,
                  batchId,
                  fontData: fontDataCopy,
                }, transferables);
              } catch (postErr) {
                cleanup();
                // postMessage threw (structured clone failure) — the bitmap was not transferred.
                try { bitmap.close(); } catch { /* ignore */ }
                reject(postErr instanceof Error ? postErr : new Error(String(postErr)));
              }
            });

            if (cancelledRef.current || currentBatchIdRef.current !== batchId) {
              // The user cancelled (or kicked off a new batch) while this image was in flight — drop the result.
              break;
            }

            results.push(result);
            onImageComplete?.(image.id, result);

          } catch (error) {
            if (cancelledRef.current) break;
            const errorMessage = error instanceof Error ? error.message : 'Processing failed';
            console.error(`Framr: failed to process "${image.name}"`, error);
            onImageError?.(image.id, errorMessage);
          }
        }
      } finally {
        isProcessingRef.current = false;
        currentBatchIdRef.current = '';
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: cancelledRef.current ? prev.progress : 100,
          results,
        }));
      }

      return { results };
    },
    [ensureWorker, drainAndRecycleWorker],
  );

  const cancelProcessing = useCallback(() => {
    cancelledRef.current = true;
    setState((prev) => ({ ...prev, cancelled: true }));
    // Drop any pending result-waiters so the loop exits promptly.
    const pending = Array.from(pendingHandlersRef.current);
    pendingHandlersRef.current.clear();
    for (const handler of pending) {
      handler.cleanup();
      handler.reject(new Error('Cancelled'));
    }
    // Terminate the worker so the in-flight image actually stops consuming
    // CPU/memory — rejecting handlers alone leaves the worker grinding for
    // seconds on large images, and the next batch would queue behind it.
    // ensureWorker recreates a fresh worker on the next processImages call.
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      currentIndex: 0,
      totalCount: 0,
      progress: 0,
      currentImageName: '',
      results: [],
      cancelled: false,
    });
  }, []);

  return {
    ...state,
    processImages,
    cancelProcessing,
    resetState,
  };
}
