import { useState, useCallback, useRef } from 'react';
import type { AspectRatio, ImageFile, BorderSettings, ResizeSettings, OutputSettings, ProcessingResult, CanvasBackground, Toast, ToastVariant, TextOverlaySettings } from '../types';
import { createImageFile, checkMemoryWarning, cleanupImageResources, generateId, ImageLoadError } from '../utils/imageUtils';
import { DEFAULT_BORDER_SETTINGS } from '../utils/constants';
import { extractExifDate } from '../utils/exif';
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
  fontWeight: 400,
  color: '#000000',
  useAutoColor: true,
  opacity: 1.0,
  dateStampFormat: 'japanese',
  textShadow: {
    enabled: false,
    color: '#000000',
    useAutoColor: true,
    blur: 3,
    offsetX: 1,
    offsetY: 1,
  },
  textEffect: 'none',
  effectIntensity: 0.5,
};

const MAX_TOASTS = 5;

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
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = generateId();
    setToasts((prev) => {
      const next = [...prev, { id, variant, message }];
      // Keep the queue bounded so an error storm doesn't bury the UI.
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
    });
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

  // Synchronously-maintained membership for orphan-result detection. Worker
  // callbacks need to know "is this imageId still in the queue right now?"
  // — and the post-commit effect that mirrors `images` into a ref lags one
  // render behind. Updating this Set imperatively in the mutation handlers
  // (before the setImages call) closes the window where a result for a
  // just-removed image could still be appended.
  const liveImageIdsRef = useRef<Set<string>>(new Set());
  // Cache of imageId → name for richer error/completion toasts.
  const imageNamesRef = useRef<Map<string, string>>(new Map());

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newImages: ImageFile[] = [];
    const failures: { name: string; reason: string }[] = [];

    for (const file of files) {
      try {
        const imageFile = await createImageFile(file);
        try {
          const exifDate = await extractExifDate(file);
          if (exifDate) imageFile.exifDate = exifDate;
        } catch (exifErr) {
          // EXIF is non-essential — log but don't fail the import.
          console.warn(`Framr: EXIF extraction failed for "${file.name}"`, exifErr);
        }
        newImages.push(imageFile);
      } catch (error) {
        const reason = error instanceof ImageLoadError
          ? `couldn't decode (${file.type || 'unknown type'})`
          : error instanceof Error ? error.message : 'unknown error';
        console.error(`Framr: failed to load "${file.name}"`, error);
        failures.push({ name: file.name, reason });
      }
    }

    if (newImages.length > 0) {
      // Update the membership refs synchronously before queuing state so a
      // worker message arriving on the very next microtask sees the new IDs.
      for (const img of newImages) {
        liveImageIdsRef.current.add(img.id);
        imageNamesRef.current.set(img.id, img.name);
      }
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        setMemoryWarning(checkMemoryWarning(updated));
        return updated;
      });
      setSelectedId((prev) => prev ?? newImages[0].id);
    }

    if (failures.length === 1) {
      addToast(`Couldn't load "${failures[0].name}" — ${failures[0].reason}`, 'error');
    } else if (failures.length > 1) {
      const names = failures.slice(0, 3).map((f) => f.name).join(', ');
      const more = failures.length > 3 ? ` and ${failures.length - 3} more` : '';
      addToast(`${failures.length} files failed to load: ${names}${more}`, 'error');
    }
  }, [addToast]);

  const handleRemoveImage = useCallback((id: string) => {
    // Drop from the membership ref synchronously so any worker result already
    // in flight is treated as orphan.
    liveImageIdsRef.current.delete(id);
    imageNamesRef.current.delete(id);

    let removedImage: ImageFile | undefined;

    setImages((prev) => {
      removedImage = prev.find((img) => img.id === id);
      const updated = prev.filter((img) => img.id !== id);
      setMemoryWarning(checkMemoryWarning(updated));

      setSelectedId((prevSelected) => {
        if (prevSelected !== id) return prevSelected;
        return updated.length > 0 ? updated[0].id : null;
      });

      return updated;
    });

    setResults((prev) => prev.filter((r) => r.imageId !== id));

    if (removedImage) {
      cleanupImageResources(removedImage);
    }
  }, []);

  const handleRetryImage = useCallback((id: string) => {
    setImages((prev) =>
      prev.map((img) => img.id === id ? { ...img, status: 'pending', error: undefined } : img),
    );
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
    // Cancel any in-flight work first so worker callbacks can't re-populate the lists we're about to wipe.
    cancelProcessing();

    // Drop membership synchronously so late worker messages are treated as orphans.
    liveImageIdsRef.current.clear();
    imageNamesRef.current.clear();

    setImages((prev) => {
      prev.forEach(cleanupImageResources);
      return [];
    });
    setResults([]);
    setSelectedId(null);
    setMemoryWarning(false);
    resetState();
  }, [cancelProcessing, resetState]);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleProcess = useCallback(async () => {
    // Bail BEFORE the optimistic flip when a batch is already running.
    // Without this, two rapid clicks both read the same pre-commit `images`
    // closure, both compute the same `optimisticIds`, and the second call's
    // busy-rollback then flips rows the first call is actually processing
    // back to 'pending'.
    if (isProcessing) {
      addToast('Already processing — wait for the current batch to finish.', 'warning');
      return;
    }

    const pendingImages = images.filter((img) => img.status === 'pending');
    if (pendingImages.length === 0) return;

    // Track which IDs we optimistically flipped to "processing" so a busy
    // rollback only touches THESE rows — not any row already being processed
    // by an earlier batch.
    const optimisticIds = new Set(pendingImages.map((img) => img.id));

    setImages((prev) =>
      prev.map((img) =>
        optimisticIds.has(img.id) ? { ...img, status: 'processing' } : img,
      ),
    );

    const config = {
      border: borderSettings,
      resize: resizeSettings,
      output: outputSettings,
      targetAspectRatio,
      textOverlay: textOverlay.enabled ? textOverlay : undefined,
    };

    const completedNames: string[] = [];
    const failures: { name: string; reason: string }[] = [];

    const { rejected } = await processImages(
      pendingImages,
      config,
      (imageId, result) => {
        // Drop orphan results — the membership ref is updated synchronously
        // inside handleRemoveImage/handleClearAll, so this check sees a removal
        // even before React has committed the state change.
        if (!liveImageIdsRef.current.has(imageId)) return;
        const name = imageNamesRef.current.get(imageId);
        if (name) completedNames.push(name);
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'done', processedBlob: result.blob } : img,
          ),
        );
        setResults((prev) => [...prev, result]);
      },
      (imageId, error) => {
        if (!liveImageIdsRef.current.has(imageId)) return;
        const name = imageNamesRef.current.get(imageId);
        if (name) failures.push({ name, reason: error });
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'error', error } : img,
          ),
        );
      },
      (warning) => addToast(warning, 'warning'),
    );

    if (rejected === 'busy') {
      // Roll back only the rows this click flipped — don't disturb the image
      // an earlier batch is genuinely working on.
      setImages((prev) =>
        prev.map((img) =>
          optimisticIds.has(img.id) && img.status === 'processing'
            ? { ...img, status: 'pending' }
            : img,
        ),
      );
      addToast('Already processing — wait for the current batch to finish.', 'warning');
      return;
    }

    if (completedNames.length > 0) {
      addToast(
        `${completedNames.length} image${completedNames.length !== 1 ? 's' : ''} processed.`,
        'success',
      );
    }
    if (failures.length > 0) {
      const names = failures.slice(0, 2).map((f) => `"${f.name}"`).join(', ');
      const more = failures.length > 2 ? ` and ${failures.length - 2} more` : '';
      addToast(`Failed: ${names}${more} — ${failures[0].reason}`, 'error');
    }
  }, [isProcessing, images, borderSettings, resizeSettings, outputSettings, targetAspectRatio, textOverlay, processImages, addToast]);

  const handleCancel = useCallback(() => {
    cancelProcessing();
    setImages((prev) =>
      prev.map((img) =>
        img.status === 'processing' ? { ...img, status: 'pending' } : img,
      ),
    );
  }, [cancelProcessing]);

  const hasImages = images.length > 0;

  const handleNavigate = useCallback((direction: 'up' | 'down') => {
    if (images.length === 0) return;
    const currentIdx = images.findIndex((img) => img.id === selectedId);
    if (direction === 'up') {
      const newIndex = currentIdx <= 0 ? images.length - 1 : currentIdx - 1;
      setSelectedId(images[newIndex].id);
    } else {
      const newIndex = currentIdx >= images.length - 1 ? 0 : currentIdx + 1;
      setSelectedId(images[newIndex].id);
    }
  }, [images, selectedId]);

  const handleShowShortcuts = useCallback(() => setIsShortcutsHelpOpen(true), []);

  useKeyboardShortcuts({
    onProcess: handleProcess,
    onRemoveSelected: () => { if (selectedId) handleRemoveImage(selectedId); },
    onNavigate: handleNavigate,
    onDeselect: () => setSelectedId(null),
    onShowHelp: handleShowShortcuts,
    hasImages,
    selectedId,
    isProcessing,
  });

  const selectedImage = images.find((img) => img.id === selectedId) || null;

  return (
    // 100dvh bounds the app to the visible viewport, including mobile browser
    // chrome changes, so a 100% zoom on a large image cannot push controls off
    // the bottom edge.
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-gray-900 focus:text-white focus:rounded">
        Skip to main content
      </a>

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
        className="sr-only"
        aria-label="Add images"
      />

      <header className="relative flex items-center justify-between px-6 md:px-8 py-4 border-b bg-paper-50/80 dark:bg-darkroom-100/80 backdrop-blur-sm">
        <div className="flex items-baseline gap-3">
          <h1 className="wordmark text-3xl text-ink-900 dark:text-paper-50 leading-none">
            Framr
          </h1>
          <span
            className="hidden lg:inline-block text-2xs uppercase tracking-[0.2em] text-ink-100 dark:text-darkroom-500 font-mono"
            aria-hidden="true"
          >
            — borders for photographers
          </span>
        </div>

        <div className="flex items-center gap-1">
          <KeyboardShortcutsHelp
            isOpen={isShortcutsHelpOpen}
            onOpenChange={setIsShortcutsHelpOpen}
          />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main id="main" className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {!hasImages ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl">
              <DropZone onFilesSelected={handleFilesSelected} hasImages={false} />
            </div>
          </div>
        ) : (
          <>
            <aside
              className="hidden lg:flex w-80 xl:w-96 border-r bg-paper-50/70 dark:bg-darkroom-100/70 backdrop-blur-sm flex-col overflow-hidden"
              aria-label="Images and controls"
            >
              <div className="p-4 border-b">
                <DropZone onFilesSelected={handleFilesSelected} hasImages={true} />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ImageQueue
                  images={images}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={handleRemoveImage}
                  onRetry={handleRetryImage}
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
                  exifDate={selectedImage?.exifDate}
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

            {/* min-h-0 is critical: a flex item's default min-height is auto
                (intrinsic content height), which lets a large preview canvas
                push the preset bar off the viewport even with overflow-hidden.
                Setting min-h-0 lets the flex container actually clip. */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <div className="flex-1 min-h-0 overflow-hidden">
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

              <div className="hidden lg:block px-6 py-5 border-t bg-paper-50/80 dark:bg-darkroom-100/80 backdrop-blur-sm">
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
                  onToast={addToast}
                />
              </div>

              {memoryWarning && (
                <div
                  className="px-4 py-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-sm border-t border-amber-200 dark:border-amber-800"
                  role="status"
                >
                  Memory warning: Processing many large images may cause slowdowns. Consider processing in smaller batches.
                </div>
              )}
            </div>

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
                  onRetry={handleRetryImage}
                  onAddMore={handleAddMore}
                  onClearAll={handleClearAll}
                  onReorderImages={handleReorderImages}
                />
              </div>
            </MobileDrawer>

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
                  exifDate={selectedImage?.exifDate}
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
                    onToast={addToast}
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

      <footer className="hidden lg:flex items-center justify-between py-3 px-6 border-t text-xs text-ink-100 dark:text-darkroom-500 bg-paper-50/60 dark:bg-darkroom-100/60 backdrop-blur-sm">
        <span className="font-mono uppercase tracking-[0.15em]">
          No uploads · 100% on-device
        </span>
        <a
          href="https://github.com/totally-tim/framr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-ink-900 dark:hover:text-paper-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:rounded-sm px-1"
          aria-label="View source on GitHub"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Open source
        </a>
      </footer>
    </div>
  );
}
