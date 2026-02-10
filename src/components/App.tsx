import { useState, useCallback, useRef } from 'react';
import type { ImageFile, BorderSettings, ResizeSettings, OutputSettings, ProcessingResult, CanvasBackground } from '../types';
import { createImageFile, checkMemoryWarning, cleanupImageResources } from '../utils/imageUtils';
import { useTheme } from '../hooks/useTheme';
import { useImageProcessor } from '../hooks/useImageProcessor';
import { DropZone } from './DropZone';
import { ImageQueue } from './ImageQueue';
import { PreviewCanvas } from './PreviewCanvas';
import { ControlPanel } from './ControlPanel';
import { PresetButtons } from './PresetButtons';
import { DownloadPanel } from './DownloadPanel';
import { ThemeToggle } from './ThemeToggle';
import { MobileDrawer } from './MobileDrawer';
import { MobileActionBar } from './MobileActionBar';

const DEFAULT_BORDER_SETTINGS: BorderSettings = {
  width: 5,
  widthUnit: '%',
  color: '#FFFFFF',
  aspectAware: false,
};

const DEFAULT_RESIZE_SETTINGS: ResizeSettings = {
  enabled: false,
  maintainAspect: true,
  unit: 'px',
};

const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  format: 'original',
  quality: 95,
};

const DEFAULT_CANVAS_BACKGROUND: CanvasBackground = {
  mode: 'checkerboard',
  color: '#808080',
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [borderSettings, setBorderSettings] = useState<BorderSettings>(DEFAULT_BORDER_SETTINGS);
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>(DEFAULT_RESIZE_SETTINGS);
  const [outputSettings, setOutputSettings] = useState<OutputSettings>(DEFAULT_OUTPUT_SETTINGS);
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackground>(DEFAULT_CANVAS_BACKGROUND);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [memoryWarning, setMemoryWarning] = useState(false);
  const [isImagesDrawerOpen, setIsImagesDrawerOpen] = useState(false);
  const [isControlsDrawerOpen, setIsControlsDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing,
    progress,
    processImages,
    cancelProcessing,
    resetState,
  } = useImageProcessor();

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newImages: ImageFile[] = [];

    for (const file of files) {
      try {
        const imageFile = await createImageFile(file);
        newImages.push(imageFile);
      } catch (error) {
        console.error('Failed to load image:', file.name, error);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        setMemoryWarning(checkMemoryWarning(updated));
        return updated;
      });

      // Use functional update to avoid dependency on selectedId
      setSelectedId((prev) => prev ?? newImages[0].id);
    }
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      // Find and clean up the removed image
      const removedImage = prev.find((img) => img.id === id);
      if (removedImage) {
        cleanupImageResources(removedImage);
      }
      
      const updated = prev.filter((img) => img.id !== id);
      setMemoryWarning(checkMemoryWarning(updated));

      // Update selectedId from within setImages to access latest list
      setSelectedId((prevSelected) => {
        if (prevSelected !== id) return prevSelected;
        return updated.length > 0 ? updated[0].id : null;
      });

      return updated;
    });

    setResults((prev) => {
      // Clean up blob from removed result
      const removedResult = prev.find((r) => r.imageId === id);
      if (removedResult) {
        (removedResult as { blob?: Blob }).blob = undefined;
      }
      return prev.filter((r) => r.imageId !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    // Clean up all image and result resources before clearing
    setImages((prev) => {
      prev.forEach(cleanupImageResources);
      return [];
    });
    setResults((prev) => {
      prev.forEach((result) => {
        (result as { blob?: Blob }).blob = undefined;
      });
      return [];
    });
    
    setSelectedId(null);
    setMemoryWarning(false);
    resetState();
  }, [resetState]);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleProcess = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending');
    if (pendingImages.length === 0) return;

    setImages((prev) =>
      prev.map((img) =>
        img.status === 'pending' ? { ...img, status: 'processing' } : img
      )
    );

    const config = {
      border: borderSettings,
      resize: resizeSettings,
      output: outputSettings,
    };

    await processImages(
      pendingImages,
      config,
      (imageId, result) => {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'done', processedBlob: result.blob } : img
          )
        );
        setResults((prev) => [...prev, result]);
      },
      (imageId, error) => {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'error', error } : img
          )
        );
      }
    );
  }, [images, borderSettings, resizeSettings, outputSettings, processImages]);

  const handleCancel = useCallback(() => {
    cancelProcessing();
    setImages((prev) =>
      prev.map((img) =>
        img.status === 'processing' ? { ...img, status: 'pending' } : img
      )
    );
  }, [cancelProcessing]);

  const selectedImage = images.find((img) => img.id === selectedId) || null;
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/tiff,image/webp,.jpg,.jpeg,.png,.tiff,.tif,.webp"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-surface-light dark:bg-surface-dark">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-mono">
            {'<'}Framr{' />'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <a
            href="https://github.com/totally-tim/framr"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {!hasImages ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl">
              <DropZone onFilesSelected={handleFilesSelected} />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop sidebar - hidden on mobile */}
            <aside className="hidden md:flex w-72 xl:w-80 border-r bg-surface-light dark:bg-surface-dark flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden flex flex-col">
                <ImageQueue
                  images={images}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={handleRemoveImage}
                  onAddMore={handleAddMore}
                  onClearAll={handleClearAll}
                />
              </div>

              <div className="p-4 border-t space-y-4 overflow-y-auto scrollbar-thin">
                <ControlPanel
                  borderSettings={borderSettings}
                  resizeSettings={resizeSettings}
                  outputSettings={outputSettings}
                  canvasBackground={canvasBackground}
                  onBorderChange={setBorderSettings}
                  onResizeChange={setResizeSettings}
                  onOutputChange={setOutputSettings}
                  onCanvasBackgroundChange={setCanvasBackground}
                />

                <div className="border-t pt-4">
                  <DownloadPanel
                    images={images}
                    results={results}
                    isProcessing={isProcessing}
                    progress={progress}
                    onProcess={handleProcess}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </aside>

            {/* Main preview area */}
            <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
              <div className="flex-1 overflow-hidden">
                <PreviewCanvas
                  image={selectedImage}
                  borderSettings={borderSettings}
                  resizeSettings={resizeSettings}
                  canvasBackground={canvasBackground}
                />
              </div>

              {/* Desktop presets - hidden on mobile */}
              <div className="hidden md:block p-4 border-t bg-surface-light dark:bg-surface-dark">
                <PresetButtons
                  currentSettings={borderSettings}
                  onApply={setBorderSettings}
                />
              </div>

              {memoryWarning && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-sm border-t border-amber-200 dark:border-amber-800">
                  Memory warning: Processing many large images may cause slowdowns. Consider processing in smaller batches.
                </div>
              )}
            </div>

            {/* Mobile action bar */}
            {hasImages && (
              <MobileActionBar
                images={images}
                isProcessing={isProcessing}
                progress={progress}
                onProcess={handleProcess}
                onCancel={handleCancel}
                onOpenImages={() => setIsImagesDrawerOpen(true)}
                onOpenControls={() => setIsControlsDrawerOpen(true)}
                imageCount={images.length}
              />
            )}

            {/* Mobile Images Drawer */}
            <MobileDrawer
              isOpen={isImagesDrawerOpen}
              onClose={() => setIsImagesDrawerOpen(false)}
              title={`Images (${images.length})`}
            >
              <div className="space-y-4">
                <ImageQueue
                  images={images}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setIsImagesDrawerOpen(false);
                  }}
                  onRemove={handleRemoveImage}
                  onAddMore={handleAddMore}
                  onClearAll={handleClearAll}
                />
              </div>
            </MobileDrawer>

            {/* Mobile Controls Drawer */}
            <MobileDrawer
              isOpen={isControlsDrawerOpen}
              onClose={() => setIsControlsDrawerOpen(false)}
              title="Settings"
            >
              <div className="space-y-6">
                <ControlPanel
                  borderSettings={borderSettings}
                  resizeSettings={resizeSettings}
                  outputSettings={outputSettings}
                  canvasBackground={canvasBackground}
                  onBorderChange={setBorderSettings}
                  onResizeChange={setResizeSettings}
                  onOutputChange={setOutputSettings}
                  onCanvasBackgroundChange={setCanvasBackground}
                />

                <div className="border-t pt-4">
                  <PresetButtons
                    currentSettings={borderSettings}
                    onApply={setBorderSettings}
                  />
                </div>

                <div className="border-t pt-4">
                  <DownloadPanel
                    images={images}
                    results={results}
                    isProcessing={isProcessing}
                    progress={progress}
                    onProcess={handleProcess}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </MobileDrawer>
          </>
        )}
      </main>

      <footer className="hidden md:block py-2 px-4 border-t text-center text-xs text-gray-500 dark:text-gray-400 bg-surface-light dark:bg-surface-dark">
        Framr - Add borders to your images. All processing happens in your browser.
      </footer>
    </div>
  );
}
