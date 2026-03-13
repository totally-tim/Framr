import { useState, useCallback, useRef } from 'react';
import type { AspectRatio, ImageFile, BorderSettings, ResizeSettings, OutputSettings, ProcessingResult, CanvasBackground, Toast, ToastVariant, TextOverlaySettings } from '../types';
import { createImageFile, checkMemoryWarning, cleanupImageResources } from '../utils/imageUtils';
import { DEFAULT_BORDER_SETTINGS } from '../utils/constants';
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
import { ToastContainer } from './Toast';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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

const DEFAULT_TEXT_OVERLAY: TextOverlaySettings = {
  enabled: false,
  text: '',
  position: 'bottom-center',
  fontSize: 1.0,
  fontFamily: 'sans-serif',
  color: '#000000',
  useAutoColor: true,
  opacity: 1.0,
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [borderSettings, setBorderSettings] = useState<BorderSettings>(DEFAULT_BORDER_SETTINGS);
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>(DEFAULT_RESIZE_SETTINGS);
  const [outputSettings, setOutputSettings] = useState<OutputSettings>(DEFAULT_OUTPUT_SETTINGS);
  const [targetAspectRatio, setTargetAspectRatio] = useState<AspectRatio | undefined>(undefined);
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackground>(DEFAULT_CANVAS_BACKGROUND);
  const [textOverlay, setTextOverlay] = useState<TextOverlaySettings>(DEFAULT_TEXT_OVERLAY);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [memoryWarning, setMemoryWarning] = useState(false);
  const [isImagesDrawerOpen, setIsImagesDrawerOpen] = useState(false);
  const [isControlsDrawerOpen, setIsControlsDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, variant, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing,
    progress,
    currentIndex,
    totalCount,
    currentImageName,
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
    // Capture references before state updates for cleanup after
    let removedImage: ImageFile | undefined;
    let removedResult: ProcessingResult | undefined;

    setImages((prev) => {
      removedImage = prev.find((img) => img.id === id);
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
      removedResult = prev.find((r) => r.imageId === id);
      return prev.filter((r) => r.imageId !== id);
    });

    // Clean up resources after state updates (no mutation inside setters)
    if (removedImage) {
      cleanupImageResources(removedImage);
    }
    if (removedResult) {
      (removedResult as { blob?: Blob }).blob = undefined;
    }
  }, []);

  const handleReorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    // Capture references before clearing state
    const imagesToCleanup = images;
    const resultsToCleanup = results;

    // Clear state first (no mutations inside setters)
    setImages([]);
    setResults([]);
    setSelectedId(null);
    setMemoryWarning(false);
    resetState();

    // Clean up resources after state updates
    imagesToCleanup.forEach(cleanupImageResources);
    resultsToCleanup.forEach((result) => {
      (result as { blob?: Blob }).blob = undefined;
    });
  }, [images, results, resetState]);

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
      targetAspectRatio,
      textOverlay: textOverlay.enabled ? textOverlay : undefined,
    };

    let doneCount = 0;
    let errorCount = 0;

    await processImages(
      pendingImages,
      config,
      (imageId, result) => {
        doneCount++;
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'done', processedBlob: result.blob } : img
          )
        );
        setResults((prev) => [...prev, result]);
      },
      (imageId, error) => {
        errorCount++;
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'error', error } : img
          )
        );
      }
    );

    if (doneCount > 0) {
      addToast(
        `${doneCount} image${doneCount !== 1 ? 's' : ''} processed successfully`,
        'success'
      );
    }
    if (errorCount > 0) {
      addToast(
        `${errorCount} image${errorCount !== 1 ? 's' : ''} failed to process`,
        'error'
      );
    }
  }, [images, borderSettings, resizeSettings, outputSettings, targetAspectRatio, textOverlay, processImages, addToast]);

  const handleCancel = useCallback(() => {
    cancelProcessing();
    setImages((prev) =>
      prev.map((img) =>
        img.status === 'processing' ? { ...img, status: 'pending' } : img
      )
    );
  }, [cancelProcessing]);

  const hasImages = images.length > 0;

  const handleNavigate = useCallback((direction: 'up' | 'down') => {
    if (images.length === 0) return;
    const currentIndex = images.findIndex((img) => img.id === selectedId);
    if (direction === 'up') {
      const newIndex = currentIndex <= 0 ? images.length - 1 : currentIndex - 1;
      setSelectedId(images[newIndex].id);
    } else {
      const newIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;
      setSelectedId(images[newIndex].id);
    }
  }, [images, selectedId]);

  useKeyboardShortcuts({
    onProcess: handleProcess,
    onRemoveSelected: () => { if (selectedId) handleRemoveImage(selectedId); },
    onNavigate: handleNavigate,
    onDeselect: () => setSelectedId(null),
    hasImages,
    selectedId,
    isProcessing,
  });

  const selectedImage = images.find((img) => img.id === selectedId) || null;

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
          <KeyboardShortcutsHelp />
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
              <DropZone onFilesSelected={handleFilesSelected} hasImages={false} />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop sidebar - hidden on mobile */}
            <aside className="hidden md:flex w-72 xl:w-80 border-r bg-surface-light dark:bg-surface-dark flex-col overflow-hidden">
              <div className="p-3 border-b">
                <DropZone onFilesSelected={handleFilesSelected} hasImages={true} />
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <ImageQueue
                  images={images}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={handleRemoveImage}
                  onAddMore={handleAddMore}
                  onClearAll={handleClearAll}
                  onReorderImages={handleReorderImages}
                />
              </div>

              <div className="p-4 border-t space-y-4 overflow-y-auto scrollbar-thin">
                <ControlPanel
                  borderSettings={borderSettings}
                  resizeSettings={resizeSettings}
                  outputSettings={outputSettings}
                  canvasBackground={canvasBackground}
                  textOverlay={textOverlay}
                  onBorderChange={setBorderSettings}
                  onResizeChange={setResizeSettings}
                  onOutputChange={setOutputSettings}
                  onCanvasBackgroundChange={setCanvasBackground}
                  onTextOverlayChange={setTextOverlay}
                />

                <div className="border-t pt-4">
                  <DownloadPanel
                    images={images}
                    results={results}
                    isProcessing={isProcessing}
                    progress={progress}
                    currentIndex={currentIndex}
                    totalCount={totalCount}
                    currentImageName={currentImageName}
                    onProcess={handleProcess}
                    onCancel={handleCancel}
                    onToast={addToast}
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
                  targetAspectRatio={targetAspectRatio}
                  textOverlay={textOverlay}
                  onToast={addToast}
                />
              </div>

              {/* Desktop presets - hidden on mobile */}
              <div className="hidden md:block p-4 border-t bg-surface-light dark:bg-surface-dark">
                <PresetButtons
                  currentBorder={borderSettings}
                  currentResize={resizeSettings}
                  currentOutput={outputSettings}
                  onApply={(border, resize, output, aspectRatio) => {
                    setBorderSettings(border);
                    if (resize) setResizeSettings(resize);
                    if (output) setOutputSettings(output);
                    setTargetAspectRatio(aspectRatio);
                  }}
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
                  onReorderImages={handleReorderImages}
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
                  textOverlay={textOverlay}
                  onBorderChange={setBorderSettings}
                  onResizeChange={setResizeSettings}
                  onOutputChange={setOutputSettings}
                  onCanvasBackgroundChange={setCanvasBackground}
                  onTextOverlayChange={setTextOverlay}
                />

                <div className="border-t pt-4">
                  <PresetButtons
                    currentBorder={borderSettings}
                    currentResize={resizeSettings}
                    currentOutput={outputSettings}
                    onApply={(border, resize, output, aspectRatio) => {
                      setBorderSettings(border);
                      if (resize) setResizeSettings(resize);
                      if (output) setOutputSettings(output);
                      setTargetAspectRatio(aspectRatio);
                    }}
                  />
                </div>

                <div className="border-t pt-4">
                  <DownloadPanel
                    images={images}
                    results={results}
                    isProcessing={isProcessing}
                    progress={progress}
                    currentIndex={currentIndex}
                    totalCount={totalCount}
                    currentImageName={currentImageName}
                    onProcess={handleProcess}
                    onCancel={handleCancel}
                    onToast={addToast}
                  />
                </div>
              </div>
            </MobileDrawer>
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <footer className="hidden md:block py-2 px-4 border-t text-center text-xs text-gray-500 dark:text-gray-400 bg-surface-light dark:bg-surface-dark">
        Framr - Add borders to your images. All processing happens in your browser.
      </footer>
    </div>
  );
}
