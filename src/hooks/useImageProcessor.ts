import { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageFile, ProcessingConfig, ProcessingResult } from '../types';
import { loadImage } from '../utils/imageUtils';

interface ProcessingState {
  isProcessing: boolean;
  currentIndex: number;
  totalCount: number;
  progress: number;
  results: ProcessingResult[];
  cancelled: boolean;
}

export function useImageProcessor() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    currentIndex: 0,
    totalCount: 0,
    progress: 0,
    results: [],
    cancelled: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processImages = useCallback(
    async (
      images: ImageFile[],
      config: ProcessingConfig,
      onImageComplete?: (imageId: string, result: ProcessingResult) => void,
      onImageError?: (imageId: string, error: string) => void
    ): Promise<ProcessingResult[]> => {
      if (!workerRef.current || images.length === 0) {
        return [];
      }

      cancelledRef.current = false;

      setState({
        isProcessing: true,
        currentIndex: 0,
        totalCount: images.length,
        progress: 0,
        results: [],
        cancelled: false,
      });

      const results: ProcessingResult[] = [];

      for (let i = 0; i < images.length; i++) {
        if (cancelledRef.current) {
          break;
        }

        const image = images[i];

        setState((prev) => ({
          ...prev,
          currentIndex: i,
          progress: (i / images.length) * 100,
        }));

        try {
          const img = await loadImage(image.file);
          const bitmap = await createImageBitmap(img);

          const result = await new Promise<ProcessingResult>((resolve, reject) => {
            const handler = (event: MessageEvent) => {
              const data = event.data;

              if (data.imageId !== image.id) return;

              if (data.type === 'result') {
                workerRef.current?.removeEventListener('message', handler);
                resolve({
                  imageId: data.imageId,
                  blob: data.blob,
                  filename: data.filename,
                });
              } else if (data.type === 'error') {
                workerRef.current?.removeEventListener('message', handler);
                reject(new Error(data.error));
              } else if (data.type === 'progress') {
                const imageProgress = data.progress;
                const overallProgress = ((i + imageProgress / 100) / images.length) * 100;
                setState((prev) => ({ ...prev, progress: overallProgress }));
              }
            };

            workerRef.current?.addEventListener('message', handler);

            workerRef.current?.postMessage({
              type: 'process',
              imageBitmap: bitmap,
              config,
              originalFormat: image.name,
              filename: image.name,
              imageId: image.id,
            }, [bitmap]);
          });

          results.push(result);
          onImageComplete?.(image.id, result);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Processing failed';
          onImageError?.(image.id, errorMessage);
        }
      }

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        results,
      }));

      return results;
    },
    []
  );

  const cancelProcessing = useCallback(() => {
    cancelledRef.current = true;
    setState((prev) => ({ ...prev, cancelled: true, isProcessing: false }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      currentIndex: 0,
      totalCount: 0,
      progress: 0,
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
