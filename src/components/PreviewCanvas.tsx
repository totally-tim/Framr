import { useRef, useEffect, useState, useCallback } from 'react';
import type { ImageFile, BorderSettings, ResizeSettings } from '../types';
import { loadImage, calculateBorderSize, calculateOutputDimensions } from '../utils/imageUtils';
import { useDebounce } from '../hooks/useDebounce';

interface PreviewCanvasProps {
  image: ImageFile | null;
  borderSettings: BorderSettings;
  resizeSettings: ResizeSettings;
}

type ZoomLevel = 'fit' | '100' | number;

export function PreviewCanvas({ image, borderSettings, resizeSettings }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [error, setError] = useState<string | null>(null);

  const debouncedBorderSettings = useDebounce(borderSettings, 300);
  const debouncedResizeSettings = useDebounce(resizeSettings, 300);

  const renderPreview = useCallback(async () => {
    if (!image || !canvasRef.current || !containerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const img = await loadImage(image.file);

      const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
        img.width,
        img.height,
        showOriginal ? { enabled: false, maintainAspect: true, unit: 'px' } : debouncedResizeSettings
      );

      let border = { top: 0, right: 0, bottom: 0, left: 0 };
      if (!showOriginal) {
        border = calculateBorderSize(resizedWidth, resizedHeight, debouncedBorderSettings);
      }

      const fullWidth = resizedWidth + border.left + border.right;
      const fullHeight = resizedHeight + border.top + border.bottom;

      const container = containerRef.current;
      const containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;

      let scale: number;
      if (zoom === 'fit') {
        scale = Math.min(containerWidth / fullWidth, containerHeight / fullHeight, 1);
      } else if (zoom === '100') {
        scale = 1;
      } else {
        scale = zoom;
      }

      const scaledWidth = Math.round(fullWidth * scale);
      const scaledHeight = Math.round(fullHeight * scale);

      const canvas = canvasRef.current;
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      const ctx = canvas.getContext('2d')!;

      if (!showOriginal) {
        ctx.fillStyle = debouncedBorderSettings.color;
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);
      }

      const imageX = Math.round(border.left * scale);
      const imageY = Math.round(border.top * scale);
      const imageW = Math.round(resizedWidth * scale);
      const imageH = Math.round(resizedHeight * scale);

      ctx.drawImage(img, imageX, imageY, imageW, imageH);

    } catch (err) {
      setError('Failed to load preview');
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [image, debouncedBorderSettings, debouncedResizeSettings, showOriginal, zoom]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  useEffect(() => {
    const handleResize = () => {
      if (zoom === 'fit') {
        renderPreview();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoom, renderPreview]);

  if (!image) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <p>Select an image to preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-auto checkerboard"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full shadow-lg"
            style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-surface-light dark:bg-surface-dark">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className={`
            px-3 py-1.5 text-sm rounded-lg transition-all
            ${showOriginal
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {showOriginal ? 'Showing Original' : 'Before/After'}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {image.originalWidth} x {image.originalHeight}
          </span>

          <div className="flex rounded-lg overflow-hidden border">
            {(['fit', '100'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={`
                  px-3 py-1.5 text-xs font-medium transition-colors
                  ${zoom === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {level === 'fit' ? 'Fit' : '100%'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
