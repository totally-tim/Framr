import { useState, useCallback, useEffect, useRef } from 'react';
import type { AspectRatio, ImageFile, BorderSettings, ResizeSettings, OutputSettings, ProcessingResult, CanvasBackground, Toast, ToastVariant, TextOverlaySettings } from '../types';
import { createImageFile, checkMemoryWarning, cleanupImageResources } from '../utils/imageUtils';
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

/**
 * The theme toggle is one surface changing colour, so it should read as one
 * event. `body` already cross-fades (globals.css), and every persistent chrome
 * surface repeats the identical enumerated list, duration, and easing - without
 * it the panels snap while the page behind them fades, which is what made the
 * toggle read as two separate events.
 */
const THEME_CROSSFADE =
  'transition-[background-color,border-color,color] duration-enter ease-in-out';

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
  const [processAnnouncement, setProcessAnnouncement] = useState('');
  const emptyDropZoneRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, variant, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
        const exifDate = await extractExifDate(file);
        if (exifDate) {
          imageFile.exifDate = exifDate;
        }
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

    let errorCount = 0;
    // Cleared first, so a second run over the same batch is a change to the
    // live region rather than the identical string it already holds.
    setProcessAnnouncement('');

    const completed = await processImages(
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
        errorCount++;
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, status: 'error', error } : img
          )
        );
      }
    );

    // No success toast. Every row in the queue flips to `done` in front of the
    // user, so announcing it again is the interface talking about itself
    // (SPEC 4.5). Only the failures, which are easy to scroll past, get one.
    if (errorCount > 0) {
      addToast(
        `${errorCount} image${errorCount !== 1 ? 's' : ''} failed to process`,
        'error'
      );
    }

    /* "In front of the user" is a sighted reading of it. The row's `done` mark
       is an unlabelled glyph and the queue's only live region carries reorder
       messages, so with the toast gone a screen reader got no completion news
       at all - and SPEC 7 asks for screen reader support. The count goes to the
       sr-only region below instead of back into the toast stack, which keeps
       the interface visually quiet and still says the thing that matters. */
    /* Counted from what came back, not from the batch minus its failures: a
       cancel breaks the loop after at most the image in flight and raises no
       errors, so subtracting would have claimed the whole batch was done and
       its downloads ready while most rows sat back at `pending`. The returned
       results are the images that actually finished, whatever stopped the
       rest, so one phrasing covers failures and cancellation alike. */
    const processedCount = completed.length;
    if (processedCount > 0) {
      const plural = processedCount !== 1 ? 's' : '';
      setProcessAnnouncement(
        processedCount < pendingImages.length
          ? `${processedCount} of ${pendingImages.length} images processed. Downloads ready.`
          : `${processedCount} image${plural} processed. Downloads ready.`
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

  /* Emptying the queue unmounts whatever held focus - the row the user pressed
     Delete on, and on mobile the drawer around it and the bar button that
     opened it - so focus fell to the body and a keyboard user had to walk back
     in from the page header. The row handler can only hand focus to a
     neighbouring row, and removing the last image leaves none, so the handoff
     belongs here, at the boundary that swaps the queue for the empty state.
     The drop zone is the only control left standing and the one place a new
     file comes from. */
  const hadImagesRef = useRef(hasImages);
  useEffect(() => {
    const had = hadImagesRef.current;
    hadImagesRef.current = hasImages;
    if (had && !hasImages) emptyDropZoneRef.current?.focus();
  }, [hasImages]);

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
    /* The shell is a fixed-height frame, not a document. `min-h-dvh` would let
       the root grow with the sidebar, which leaves `main` at height auto - and
       an auto-height flex parent gives the inner `overflow-y-auto` scrollers
       nothing to resolve against, so they never engage and the whole page
       scrolls instead, taking the header and the preview off screen. `h-dvh`
       tracks the mobile address bar, and Tailwind v4's own baseline (Safari
       16.4 / Chrome 111) is already above dvh support, so no vh fallback. */
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className={`flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-surface ${THEME_CROSSFADE}`}>
        <div className="flex items-center gap-3">
          {/* Wordmark: the data voice carries the brand, per SPEC 4.4. */}
          <h1 className="text-xl font-bold text-ink data-voice">
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
            className="btn p-2 text-muted [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {!hasImages ? (
          /* Centred, but reachable: the drop target has a 400px floor and the
             shell no longer grows, so on a short viewport the outer scroller
             is what keeps the top of it from being clipped away. `min-h-full`
             on the inner row is what centres when there is room and gives up
             centring when there is not - `items-center` on the scroller itself
             would put the overflow above the scroll origin. */
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="flex min-h-full items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-2xl">
                <DropZone
                  ref={emptyDropZoneRef}
                  onFilesSelected={handleFilesSelected}
                  hasImages={false}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop sidebar - hidden on mobile */}
            <aside className={`hidden md:flex w-72 xl:w-80 border-r border-border bg-surface flex-col overflow-hidden ${THEME_CROSSFADE}`}>
              <div className="p-3 border-b border-border">
                <DropZone onFilesSelected={handleFilesSelected} hasImages={true} />
              </div>
              {/* The queue takes what the settings stack leaves over, down to
                  a floor of two rows. Without the floor it is `flex-1` with a
                  zero basis and `overflow-hidden`, so its automatic minimum
                  size is zero: once the sidebar has a real height, an expanded
                  settings stack shrinks the queue clean out of existence
                  instead of scrolling itself. */}
              <div className="flex min-h-48 flex-1 flex-col overflow-hidden">
                <ImageQueue
                  images={images}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={handleRemoveImage}
                  onClearAll={handleClearAll}
                  onReorderImages={handleReorderImages}
                />
              </div>

              <div className="p-4 border-t border-border space-y-4 overflow-y-auto scrollbar-thin">
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

                <div className="border-t border-border pt-4">
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
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
              <div className={`hidden md:block p-4 border-t border-border bg-surface ${THEME_CROSSFADE}`}>
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

              {/* The caution lives in the rule and the icon, not in the body
                  copy: `--color-warning` is an amber tuned to sit next to text,
                  not to be text, so at 14px on a light surface it would not
                  clear contrast. The message stays full-contrast ink. */}
              {memoryWarning && (
                <div className={`flex items-center gap-2 px-4 py-2 border-t border-warning bg-surface text-sm text-ink ${THEME_CROSSFADE}`}>
                  <svg className="w-4 h-4 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Memory warning: Processing many large images may cause slowdowns. Consider processing in smaller batches.</span>
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
                {/* The only way to append files on mobile. The full-size drop
                    zone above renders while the queue is empty, and the compact
                    one lives in an `md:flex` aside, so without this a phone can
                    add images exactly once and then has to clear the queue to
                    add more. */}
                <DropZone onFilesSelected={handleFilesSelected} hasImages={true} />
                <ImageQueue
                  images={images}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setIsImagesDrawerOpen(false);
                  }}
                  onRemove={handleRemoveImage}
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
                  exifDate={selectedImage?.exifDate}
                  onBorderChange={setBorderSettings}
                  onResizeChange={setResizeSettings}
                  onOutputChange={setOutputSettings}
                  onCanvasBackgroundChange={setCanvasBackground}
                  onTextOverlayChange={setTextOverlay}
                />

                <div className="border-t border-border pt-4">
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

                <div className="border-t border-border pt-4">
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

      {/* A batch finishing is only ever drawn - the row's `done` mark carries no
          text - so this is where it gets said. Mounted empty from the start,
          the same reason the queue's reorder region is: a live region that
          arrives in the same commit as its text is often missed entirely. */}
      <div role="status" aria-live="polite" className="sr-only">
        {processAnnouncement}
      </div>

      <footer className={`hidden md:block py-2 px-4 border-t border-border text-center text-xs text-muted bg-surface ${THEME_CROSSFADE}`}>
        Framr - Add borders to your images. All processing happens in your browser.
      </footer>
    </div>
  );
}
