import { useState, useCallback } from 'react';
import type { ImageFile, ProcessingResult, ToastVariant } from '../types';
import { downloadSingle, downloadAsZip, generateZipFilename } from '../utils/downloadUtils';

interface DownloadPanelProps {
  images: ImageFile[];
  results: ProcessingResult[];
  isProcessing: boolean;
  progress: number;
  currentIndex?: number;
  totalCount?: number;
  currentImageName?: string;
  onProcess: () => void;
  onCancel: () => void;
  onToast?: (message: string, variant?: ToastVariant) => void;
}

export function DownloadPanel({
  images,
  results,
  isProcessing,
  progress,
  currentIndex = 0,
  totalCount = 0,
  currentImageName = '',
  onProcess,
  onCancel,
  onToast,
}: DownloadPanelProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const pendingCount = images.filter((img) => img.status === 'pending').length;
  const doneCount = images.filter((img) => img.status === 'done').length;
  const errorCount = images.filter((img) => img.status === 'error').length;

  // One image used to read "Process All Image". Say what will happen instead.
  const processLabel =
    pendingCount === 1
      ? 'Process Image'
      : pendingCount === images.length
        ? 'Process All Images'
        : `Process ${pendingCount} Images`;

  const handleDownloadAll = useCallback(() => {
    if (results.length === 0) return;

    results.forEach((result) => {
      downloadSingle(result.blob, result.filename);
    });
    onToast?.(
      results.length === 1
        ? 'Download started'
        : `${results.length} downloads started`,
      'info'
    );
  }, [results, onToast]);

  const handleDownloadZip = useCallback(async () => {
    if (results.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    try {
      await downloadAsZip(results, generateZipFilename(), (progress) => {
        setZipProgress(progress);
      });
      onToast?.(`ZIP downloaded (${results.length} images)`, 'success');
    } catch (error) {
      console.error('ZIP creation failed:', error);
      onToast?.('ZIP download failed', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [results, onToast]);

  return (
    <div className="space-y-4">
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* `Image 3 of 12` is prose with numerals in it, so it stays in the
                chrome voice - setting only the digits in mono would split one
                label across two faces, which is the thing the rule forbids. */}
            <span className="text-muted">
              {totalCount > 0 ? `Image ${currentIndex + 1} of ${totalCount}` : 'Processing…'}
            </span>
            {/* The percentage is a value on its own, so it takes the data voice:
                tabular figures keep the digits from jittering as it counts up. */}
            <span className="data-voice shrink-0 text-ink">{Math.round(progress)}%</span>
          </div>
          {currentImageName && (
            <p className="text-xs text-muted truncate">{currentImageName}</p>
          )}
          {/* Functional motion: the fill tweens `width` only, and the width is
              driven inline from state - so under reduced motion the global rule
              drops `width` from the list and the bar still advances, stepwise.
              It needs no `motion-functional` class for that reason. The fill is
              ink rather than accent, same reasoning as the slider thumb: the
              accent budget is spent on the focus ring and Process.

              `duration-fast` is the one duration every progress bar in the app
              uses, including the mobile action bar's. A progress bar is not an
              entrance: it re-targets on every tick, and a batch can report
              faster than the 240ms entrance band, which would leave the fill
              permanently chasing the percentage printed beside it. The fast
              band smooths the step without ever falling behind the number. */}
          <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-fast ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button onClick={onCancel} className="btn w-full text-danger">
            Cancel
          </button>
        </div>
      )}

      {/* The single primary action in the app, and the one accent fill. */}
      {!isProcessing && pendingCount > 0 && (
        <button
          onClick={onProcess}
          disabled={images.length === 0}
          className="btn-primary w-full gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {processLabel}
        </button>
      )}

      {doneCount > 0 && (
        <div className="space-y-3">
          {/* Success is silent - a finished count is neutral metadata, not a
              celebration. Only the failure count takes a colour. */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted">
              {doneCount} image{doneCount !== 1 ? 's' : ''} ready
            </span>
            {errorCount > 0 && (
              <span className="text-danger shrink-0">
                {errorCount} failed
              </span>
            )}
          </div>

          {/* Both downloads are secondary: Process owns the accent fill. */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={isZipping}
              className="btn-secondary gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {results.length === 1 ? 'Download' : 'Download All'}
            </button>

            {results.length > 1 && (
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="btn-secondary gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                ZIP
              </button>
            )}
          </div>

          {isZipping && (
            <div className="space-y-1">
              <div className="text-xs text-muted text-center">Creating ZIP…</div>
              {/* Same bar, same `duration-fast` - see the reasoning above. */}
              <div className="h-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-ink transition-[width] duration-fast ease-out"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!isProcessing && pendingCount === 0 && doneCount > 0 && images.length > 0 && (
        <p className="text-xs text-muted text-center py-4">
          All images processed
        </p>
      )}
    </div>
  );
}
