import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import type { AspectRatio, ImageFile, BorderSettings, ResizeSettings, CanvasBackground, PreviewMode, TextOverlaySettings, ToastVariant } from '../types';
import { MAX_PREVIEW_SIZE, calculateBorderSize, calculateOutputDimensions } from '../utils/imageUtils';
import { calculateAspectRatioBorders } from '../utils/imageProcessing';
import { applyBorderFill } from '../utils/gradientUtils';
import { drawTextOverlay } from '../utils/textOverlay';
import { useDebounce } from '../hooks/useDebounce';
import { loadFont, isGenericFont } from '../utils/fonts';

interface PreviewCanvasProps {
  image: ImageFile | null;
  borderSettings: BorderSettings;
  resizeSettings: ResizeSettings;
  canvasBackground: CanvasBackground;
  targetAspectRatio?: AspectRatio;
  textOverlay?: TextOverlaySettings;
  onToast?: (message: string, variant?: ToastVariant) => void;
}

type ZoomLevel = 'fit' | '100' | number;

const PREVIEW_MODES: { value: PreviewMode; label: string }[] = [
  { value: 'processed', label: 'Result' },
  { value: 'original', label: 'Original' },
  { value: 'side-by-side', label: 'Side by Side' },
  { value: 'slider', label: 'Slider' },
];

interface PreviewSource {
  id: string;
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

async function decodePreviewBitmap(file: File): Promise<{ bitmap: ImageBitmap; width: number; height: number }> {
  // Render the preview against a downscaled bitmap — full-resolution source can be 50MP and
  // killing every slider tick. Cap the long edge to MAX_PREVIEW_SIZE so canvas redraws stay fast.
  const sourceBitmap = await createImageBitmap(file);
  const longest = Math.max(sourceBitmap.width, sourceBitmap.height);
  if (longest <= MAX_PREVIEW_SIZE) {
    return { bitmap: sourceBitmap, width: sourceBitmap.width, height: sourceBitmap.height };
  }
  const scale = MAX_PREVIEW_SIZE / longest;
  const w = Math.round(sourceBitmap.width * scale);
  const h = Math.round(sourceBitmap.height * scale);
  try {
    const downscaled = await createImageBitmap(sourceBitmap, {
      resizeWidth: w,
      resizeHeight: h,
      resizeQuality: 'high',
    });
    sourceBitmap.close();
    return { bitmap: downscaled, width: w, height: h };
  } catch {
    return { bitmap: sourceBitmap, width: sourceBitmap.width, height: sourceBitmap.height };
  }
}

export function PreviewCanvas({ image, borderSettings, resizeSettings, canvasBackground, targetAspectRatio, textOverlay, onToast }: PreviewCanvasProps) {
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const sliderBgRef = useRef<HTMLCanvasElement>(null);
  const sliderFgRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('processed');
  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    setZoom('fit');
    setSliderPosition(50);
  }, [image?.id]);

  const [isCopying, setIsCopying] = useState(false);

  const previewSourceRef = useRef<PreviewSource | null>(null);
  // Monotonic token — bumps on every renderPreview invocation; old loads bail if they no longer match.
  const renderTokenRef = useRef(0);

  const debouncedBorderSettings = useDebounce(borderSettings, 80);
  const debouncedResizeSettings = useDebounce(resizeSettings, 80);
  const debouncedTextOverlay = useDebounce(textOverlay, 80);

  // Font loading with a token guard so a slow font from a previous selection can't overwrite the latest.
  const [fontReady, setFontReady] = useState(0);
  const fontTokenRef = useRef(0);
  useEffect(() => {
    if (!debouncedTextOverlay?.fontFamily || isGenericFont(debouncedTextOverlay.fontFamily)) return;
    const myToken = ++fontTokenRef.current;
    const weight = debouncedTextOverlay.fontWeight || 400;
    loadFont(document.fonts, debouncedTextOverlay.fontFamily, weight)
      .then(() => {
        if (myToken === fontTokenRef.current) setFontReady((c) => c + 1);
      })
      .catch((err) => {
        console.warn(`Framr: preview font load failed for "${debouncedTextOverlay.fontFamily}"`, err);
      });
  }, [debouncedTextOverlay?.fontFamily, debouncedTextOverlay?.fontWeight]);

  const renderCanvas = useCallback((
    canvas: HTMLCanvasElement,
    source: PreviewSource,
    borderMode: 'visible' | 'invisible' | 'none',
    containerWidth: number,
    containerHeight: number,
  ) => {
    const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
      source.width,
      source.height,
      borderMode !== 'none' ? debouncedResizeSettings : { enabled: false, maintainAspect: true, unit: 'px' },
    );

    let border = { top: 0, right: 0, bottom: 0, left: 0 };
    if (borderMode !== 'none') {
      border = targetAspectRatio
        ? calculateAspectRatioBorders(resizedWidth, resizedHeight, targetAspectRatio)
        : calculateBorderSize(resizedWidth, resizedHeight, debouncedBorderSettings);
    }

    const fullWidth = resizedWidth + border.left + border.right;
    const fullHeight = resizedHeight + border.top + border.bottom;

    let scale: number;
    if (zoom === 'fit') {
      if (fullHeight > fullWidth) {
        scale = Math.min(containerWidth / fullWidth, 1);
      } else {
        scale = Math.min(containerWidth / fullWidth, containerHeight / fullHeight, 1);
      }
    } else if (zoom === '100') {
      scale = 1;
    } else {
      scale = zoom;
    }

    const scaledWidth = Math.round(fullWidth * scale);
    const scaledHeight = Math.round(fullHeight * scale);

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, scaledWidth, scaledHeight);

    if (borderMode === 'visible') {
      applyBorderFill(ctx, debouncedBorderSettings, scaledWidth, scaledHeight);
    }

    const imageX = Math.round(border.left * scale);
    const imageY = Math.round(border.top * scale);
    const imageW = Math.round(resizedWidth * scale);
    const imageH = Math.round(resizedHeight * scale);

    ctx.drawImage(source.bitmap, imageX, imageY, imageW, imageH);

    if (borderMode === 'visible' && debouncedTextOverlay?.enabled && debouncedTextOverlay.text.trim()) {
      drawTextOverlay(ctx, scaledWidth, scaledHeight, border, debouncedBorderSettings.color, debouncedTextOverlay, scale);
    }
  }, [debouncedBorderSettings, debouncedResizeSettings, targetAspectRatio, zoom, debouncedTextOverlay]);

  const renderPreview = useCallback(async () => {
    if (!image || !containerRef.current) return;

    if (previewMode === 'slider') {
      if (!sliderBgRef.current || !sliderFgRef.current) return;
    } else {
      if (!resultCanvasRef.current) return;
    }

    const myToken = ++renderTokenRef.current;
    setError(null);

    try {
      let source = previewSourceRef.current;
      if (!source || source.id !== image.id) {
        setIsLoading(true);
        const decoded = await decodePreviewBitmap(image.file);
        // If a newer render started while we were decoding, bail before we update shared state.
        if (myToken !== renderTokenRef.current) {
          decoded.bitmap.close();
          return;
        }
        // Close the previous source if we still hold one.
        previewSourceRef.current?.bitmap.close();
        source = { id: image.id, bitmap: decoded.bitmap, width: decoded.width, height: decoded.height };
        previewSourceRef.current = source;
      }

      const container = containerRef.current;

      if (zoom === 'fit') {
        if (previewMode === 'slider') {
          if (sliderBgRef.current) sliderBgRef.current.width = 1;
          if (sliderFgRef.current) sliderFgRef.current.width = 1;
        } else {
          if (resultCanvasRef.current) resultCanvasRef.current.width = 1;
          if (originalCanvasRef.current) originalCanvasRef.current.width = 1;
        }
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }

      let containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;

      if (previewMode === 'side-by-side') {
        containerWidth = (containerWidth - 16) / 2;
      }

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const isComparisonMode = previewMode === 'side-by-side' || previewMode === 'slider';

      if (previewMode === 'slider' && sliderBgRef.current && sliderFgRef.current) {
        renderCanvas(sliderBgRef.current, source, 'invisible', containerWidth, containerHeight);
        renderCanvas(sliderFgRef.current, source, 'visible', containerWidth, containerHeight);
      } else if (isComparisonMode && originalCanvasRef.current && resultCanvasRef.current) {
        renderCanvas(resultCanvasRef.current, source, 'visible', containerWidth, containerHeight);
        renderCanvas(originalCanvasRef.current, source, 'invisible', containerWidth, containerHeight);
      } else if (previewMode === 'original' && resultCanvasRef.current) {
        renderCanvas(resultCanvasRef.current, source, 'none', containerWidth, containerHeight);
      } else if (resultCanvasRef.current) {
        renderCanvas(resultCanvasRef.current, source, 'visible', containerWidth, containerHeight);
      }
    } catch (err) {
      if (myToken === renderTokenRef.current) {
        setError(`Couldn't render preview: ${err instanceof Error ? err.message : 'unknown error'}`);
        console.error('Framr: preview error', err);
      }
    } finally {
      if (myToken === renderTokenRef.current) setIsLoading(false);
    }
  }, [image, renderCanvas, previewMode, zoom]);

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleSliderMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleSliderMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSliderTouchMove = useCallback((e: TouchEvent) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSliderMouseMove);
      window.addEventListener('mouseup', handleSliderMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSliderMouseMove);
        window.removeEventListener('mouseup', handleSliderMouseUp);
      };
    }
  }, [isDragging, handleSliderMouseMove, handleSliderMouseUp]);

  // Release the cached bitmap on image swap or unmount.
  useEffect(() => {
    return () => {
      previewSourceRef.current?.bitmap.close();
      previewSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (previewSourceRef.current && previewSourceRef.current.id !== image?.id) {
      previewSourceRef.current.bitmap.close();
      previewSourceRef.current = null;
    }
  }, [image?.id]);

  useLayoutEffect(() => {
    renderPreview();
  }, [renderPreview, fontReady]);

  // Coalesce resize events into the next frame so dragging the window doesn't redraw on every event.
  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      if (zoom !== 'fit') return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderPreview();
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [zoom, renderPreview]);

  const handleCopyToClipboard = useCallback(async () => {
    const canvas = resultCanvasRef.current;
    if (!canvas || !image) return;
    if (!navigator.clipboard?.write) {
      onToast?.('Clipboard not supported in this browser', 'warning');
      return;
    }
    setIsCopying(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create image blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      onToast?.('Image copied to clipboard', 'success');
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      console.error('Framr: clipboard copy failed', err);
      onToast?.(`Couldn't copy to clipboard — ${reason}`, 'error');
    } finally {
      setIsCopying(false);
    }
  }, [image, onToast]);

  if (!image) {
    return (
      <div className="flex items-center justify-center h-full text-ink-100 dark:text-darkroom-500 font-display text-lg italic">
        <p>Select a negative to preview</p>
      </div>
    );
  }

  const leftLabel = swapped ? 'Original' : 'Result';
  const rightLabel = swapped ? 'Result' : 'Original';

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className={`flex-1 flex p-4 overflow-auto relative ${canvasBackground.mode === 'checkerboard' ? 'checkerboard' : ''}`}
        style={{
          alignItems: 'safe center',
          justifyContent: 'safe center',
          ...(canvasBackground.mode === 'solid' && { backgroundColor: canvasBackground.color }),
        }}
        aria-label="Image preview"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50" aria-live="polite">
            <div className="w-8 h-8 border-3 border-ink-900 dark:border-paper-50 border-t-transparent rounded-full motion-safe:animate-spin" role="img" aria-label="Loading preview" />
          </div>
        )}

        {error ? (
          <div className="text-red-700 dark:text-red-400" role="alert">{error}</div>
        ) : previewMode === 'side-by-side' ? (
          <div className={`flex gap-4 items-center justify-center ${swapped ? 'flex-row-reverse' : ''}`}>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">Result</span>
              <canvas
                ref={resultCanvasRef}
                className="shadow-lg"
                style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
                aria-label="Result image"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">Original</span>
              <canvas
                ref={originalCanvasRef}
                className="shadow-lg"
                style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
                aria-label="Original image"
              />
            </div>
          </div>
        ) : previewMode === 'slider' ? (
          <div
            ref={sliderContainerRef}
            className="relative cursor-ew-resize select-none"
            onMouseDown={handleSliderMouseDown}
            onTouchMove={(e) => handleSliderTouchMove(e.nativeEvent)}
            style={{ touchAction: 'none' }}
            role="img"
            aria-label="Compare original and result with a slider"
          >
            <canvas
              ref={sliderBgRef}
              className="shadow-lg"
              style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
            />

            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={swapped
                ? { left: `${sliderPosition}%`, width: `${100 - sliderPosition}%`, height: '100%' }
                : { left: 0, width: `${sliderPosition}%`, height: '100%' }
              }
            >
              <canvas
                ref={sliderFgRef}
                className="shadow-lg"
                style={{
                  imageRendering: zoom === '100' ? 'pixelated' : 'auto',
                  maxWidth: 'none',
                  transform: swapped ? `translateX(-${sliderPosition}%)` : undefined,
                }}
              />
            </div>

            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              aria-hidden="true"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
                </svg>
              </div>
            </div>

            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
              {leftLabel}
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
              {rightLabel}
            </div>
          </div>
        ) : (
          <figure className="flex flex-col items-center mat-fade">
            <div className="relative bg-paper-50 dark:bg-darkroom-100 p-3 md:p-4 shadow-print dark:shadow-print-dark">
              <canvas
                ref={resultCanvasRef}
                className="max-w-full block"
                style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
                aria-label={`Preview of ${image.name}`}
              />
            </div>
            <figcaption className="mt-3 flex items-center gap-3 px-2 text-2xs font-mono uppercase tracking-[0.18em] text-ink-100 dark:text-darkroom-500 max-w-full">
              <span className="truncate" title={image.name}>
                {image.name}
              </span>
              <span className="w-1 h-1 rounded-full bg-paper-400 dark:bg-darkroom-400 flex-shrink-0" aria-hidden="true" />
              <span className="flex-shrink-0">
                {image.originalWidth} × {image.originalHeight}
              </span>
              {image.exifDate && (
                <>
                  <span className="w-1 h-1 rounded-full bg-paper-400 dark:bg-darkroom-400 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-shrink-0">
                    {image.exifDate.toISOString().slice(0, 10)}
                  </span>
                </>
              )}
            </figcaption>
          </figure>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-paper-50/80 dark:bg-darkroom-100/80 backdrop-blur-sm">
        <div className="flex items-center gap-2" role="group" aria-label="Preview mode">
          <div className="flex rounded-lg overflow-hidden border">
            {PREVIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPreviewMode(mode.value)}
                className={`
                  px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:z-10
                  ${previewMode === mode.value
                    ? 'bg-ink-900 text-paper-50 dark:bg-paper-50 dark:text-ink-900'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                aria-pressed={previewMode === mode.value}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {(previewMode === 'side-by-side' || previewMode === 'slider') && (
            <button
              type="button"
              onClick={() => setSwapped(!swapped)}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500"
              aria-label="Swap original and result"
              title="Swap original and result"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 mr-2 font-mono" aria-label={`Image dimensions ${image.originalWidth} by ${image.originalHeight}`}>
            {image.originalWidth} × {image.originalHeight}
          </span>

          <div className="flex rounded-lg overflow-hidden border" role="group" aria-label="Zoom">
            {(['fit', '100'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setZoom(level)}
                className={`
                  px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:z-10
                  ${zoom === level
                    ? 'bg-ink-900 text-paper-50 dark:bg-paper-50 dark:text-ink-900'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                aria-pressed={zoom === level}
              >
                {level === 'fit' ? 'Fit' : '100%'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={isCopying || previewMode === 'slider' || previewMode === 'side-by-side'}
            title="Copy result to clipboard"
            aria-label="Copy result image to clipboard"
            className="p-2 min-w-[36px] min-h-[36px] rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
