import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import type { ImageFile, BorderSettings, ResizeSettings, CanvasBackground, PreviewMode } from '../types';
import { loadImage, calculateBorderSize, calculateOutputDimensions } from '../utils/imageUtils';
import { useDebounce } from '../hooks/useDebounce';

interface PreviewCanvasProps {
  image: ImageFile | null;
  borderSettings: BorderSettings;
  resizeSettings: ResizeSettings;
  canvasBackground: CanvasBackground;
}

type ZoomLevel = 'fit' | '100' | number;

const PREVIEW_MODES: { value: PreviewMode; label: string }[] = [
  { value: 'processed', label: 'Result' },
  { value: 'original', label: 'Original' },
  { value: 'side-by-side', label: 'Side by Side' },
  { value: 'slider', label: 'Slider' },
];

export function PreviewCanvas({ image, borderSettings, resizeSettings, canvasBackground }: PreviewCanvasProps) {
  // Source canvases - always hold Result and Original
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Display canvases for slider mode
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

  // Cache decoded image to avoid expensive re-decode on every settings change
  const loadedImageRef = useRef<{ id: string; img: HTMLImageElement } | null>(null);

  const debouncedBorderSettings = useDebounce(borderSettings, 80);
  const debouncedResizeSettings = useDebounce(resizeSettings, 80);

  const renderCanvas = useCallback(async (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    borderMode: 'visible' | 'invisible' | 'none',
    containerWidth: number,
    containerHeight: number
  ) => {
    const { width: resizedWidth, height: resizedHeight } = calculateOutputDimensions(
      img.width,
      img.height,
      borderMode !== 'none' ? debouncedResizeSettings : { enabled: false, maintainAspect: true, unit: 'px' }
    );

    let border = { top: 0, right: 0, bottom: 0, left: 0 };
    if (borderMode !== 'none') {
      border = calculateBorderSize(resizedWidth, resizedHeight, debouncedBorderSettings);
    }

    const fullWidth = resizedWidth + border.left + border.right;
    const fullHeight = resizedHeight + border.top + border.bottom;

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

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext('2d')!;
    
    // Clear the canvas explicitly
    ctx.clearRect(0, 0, scaledWidth, scaledHeight);

    if (borderMode === 'visible') {
      ctx.fillStyle = debouncedBorderSettings.color;
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    }

    const imageX = Math.round(border.left * scale);
    const imageY = Math.round(border.top * scale);
    const imageW = Math.round(resizedWidth * scale);
    const imageH = Math.round(resizedHeight * scale);

    ctx.drawImage(img, imageX, imageY, imageW, imageH);

    return { scaledWidth, scaledHeight };
  }, [debouncedBorderSettings, debouncedResizeSettings, zoom]);

  const renderPreview = useCallback(async () => {
    if (!image || !containerRef.current) return;
    
    // For slider mode, check slider refs; for other modes, check resultCanvasRef
    if (previewMode === 'slider') {
      if (!sliderBgRef.current || !sliderFgRef.current) return;
    } else {
      if (!resultCanvasRef.current) return;
    }

    setError(null);

    try {
      // Use cached image when available — only decode on image switch
      let img: HTMLImageElement;
      if (loadedImageRef.current?.id === image.id) {
        img = loadedImageRef.current.img;
      } else {
        setIsLoading(true);
        img = await loadImage(image.file);
        loadedImageRef.current = { id: image.id, img };
      }

      const container = containerRef.current;

      // Reset canvas sizes to get accurate container dimensions
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

      const isComparisonMode = previewMode === 'side-by-side' || previewMode === 'slider';

      if (previewMode === 'slider' && sliderBgRef.current && sliderFgRef.current) {
        // Slider mode: always keep the visible-border rendering on the clipped (top) canvas.
        // This avoids the "visible border bleeding through" when the top canvas has a transparent border.
        await renderCanvas(sliderBgRef.current, img, 'invisible', containerWidth, containerHeight);
        await renderCanvas(sliderFgRef.current, img, 'visible', containerWidth, containerHeight);
      } else if (isComparisonMode && originalCanvasRef.current && resultCanvasRef.current) {
        // Side-by-side mode
        await renderCanvas(resultCanvasRef.current, img, 'visible', containerWidth, containerHeight);
        await renderCanvas(originalCanvasRef.current, img, 'invisible', containerWidth, containerHeight);
      } else if (previewMode === 'original' && resultCanvasRef.current) {
        // Original-only mode, render without border
        await renderCanvas(resultCanvasRef.current, img, 'none', containerWidth, containerHeight);
      } else if (resultCanvasRef.current) {
        // Default (processed) mode
        await renderCanvas(resultCanvasRef.current, img, 'visible', containerWidth, containerHeight);
      }

    } catch (err) {
      setError('Failed to load preview');
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [image, renderCanvas, previewMode, zoom, swapped]);

  // Slider drag handlers
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

  // Clear image cache on unmount
  useEffect(() => {
    return () => {
      loadedImageRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Force re-render when swapped changes (in case renderPreview reference didn't update)
  useEffect(() => {
    if (previewMode === 'slider') {
      renderPreview();
    }
  }, [swapped, previewMode]);

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

  // Determine labels based on swap state
  const leftLabel = swapped ? 'Original' : 'Result';
  const rightLabel = swapped ? 'Result' : 'Original';

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className={`flex-1 flex items-center justify-center p-4 overflow-auto ${canvasBackground.mode === 'checkerboard' ? 'checkerboard' : ''}`}
        style={canvasBackground.mode === 'solid' ? { backgroundColor: canvasBackground.color } : undefined}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error ? (
          <div className="text-red-500">{error}</div>
        ) : previewMode === 'side-by-side' ? (
          <div className={`flex gap-4 items-center justify-center ${swapped ? 'flex-row-reverse' : ''}`}>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">Result</span>
              <canvas
                ref={resultCanvasRef}
                className="shadow-lg"
                style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">Original</span>
              <canvas
                ref={originalCanvasRef}
                className="shadow-lg"
                style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
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
          >
            {/* Background canvas (full size, visible on right) */}
            <canvas
              ref={sliderBgRef}
              className="shadow-lg"
              style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
            />
            
            {/* Foreground canvas (clipped, visible on left) */}
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
            
            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
                </svg>
              </div>
            </div>
            
            {/* Labels */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              {leftLabel}
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              {rightLabel}
            </div>
          </div>
        ) : (
          <canvas
            ref={resultCanvasRef}
            className="max-w-full max-h-full shadow-lg"
            style={{ imageRendering: zoom === '100' ? 'pixelated' : 'auto' }}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-surface-light dark:bg-surface-dark">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border">
            {PREVIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPreviewMode(mode.value)}
                className={`
                  px-3 py-1.5 text-xs font-medium transition-colors
                  ${previewMode === mode.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {(previewMode === 'side-by-side' || previewMode === 'slider') && (
            <button
              onClick={() => setSwapped(!swapped)}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Swap original and result"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
              </svg>
            </button>
          )}
        </div>

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
