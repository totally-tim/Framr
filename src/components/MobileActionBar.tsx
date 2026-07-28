import type { ImageFile } from '../types';

interface MobileActionBarProps {
  images: ImageFile[];
  isProcessing: boolean;
  progress: number;
  currentIndex?: number;
  totalCount?: number;
  onProcess: () => void;
  onCancel: () => void;
  onOpenImages: () => void;
  onOpenControls: () => void;
  imageCount: number;
}

export function MobileActionBar({
  images,
  isProcessing,
  progress,
  currentIndex = 0,
  totalCount = 0,
  onProcess,
  onCancel,
  onOpenImages,
  onOpenControls,
  imageCount,
}: MobileActionBarProps) {
  const pendingCount = images.filter((img) => img.status === 'pending').length;
  const doneCount = images.filter((img) => img.status === 'done').length;
  const hasImages = images.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-surface border-t border-border shadow-lg dark:shadow-none safe-bottom z-40 transition-[background-color,border-color,color] duration-enter ease-in-out">
      {/* Progress bar when processing */}
      {isProcessing && (
        <div>
          <div className="h-1 bg-surface-sunken">
            {/*
              Width comes from state, so the bar advances stepwise on its own
              and needs no `motion-functional` opt-out - it keeps reporting real
              progress under reduced motion, just without the tween. The fill is
              `ink`, not accent: the accent budget buys the focus ring and the
              Process button, and a progress bar needs contrast, not colour.

              `duration-fast`, matching the desktop progress bar in
              DownloadPanel: one operation reported in two places cannot run at
              two speeds, and a bar that re-targets on every tick must not tween
              for longer than the gap between ticks or it reports stale
              progress. This was `duration-enter` (240ms), which is the
              entrance band - a progress bar never enters, it tracks.
            */}
            <div
              className="h-full bg-ink transition-[width] duration-fast ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {totalCount > 0 && (
            <div className="px-3 py-1 text-xs text-muted">
              Image {currentIndex + 1} of {totalCount}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        {/* Images button */}
        <button
          type="button"
          onClick={onOpenImages}
          className="btn-secondary gap-2 px-3 py-2"
          aria-label="View images"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {/* Data voice: a bare count standing alone in its own element, with no
              prose wrapped around it. The `Process (2)` label below is the other
              case - a numeral inside a phrase - so it stays entirely in the
              chrome voice rather than switching face mid-label. */}
          <span className="data-voice">{imageCount}</span>
        </button>

        {/* Controls button */}
        <button
          type="button"
          onClick={onOpenControls}
          className="btn-secondary gap-2 px-3 py-2"
          aria-label="Open controls"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Settings</span>
        </button>

        {/* Process/Cancel button - takes remaining space */}
        <div className="flex-1">
          {isProcessing ? (
            // Stopping work is destructive, so it reads through the danger rule
            // and danger text on a neutral surface, never a saturated fill -
            // a red slab next to the accent would blow the accent budget twice.
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary w-full gap-2 px-4 py-2.5 border-danger text-danger"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          ) : (
            // Process is the one primary action in the whole app, so it is the
            // one place an accent fill is allowed.
            <button
              type="button"
              onClick={onProcess}
              disabled={!hasImages || pendingCount === 0}
              className="btn-primary w-full gap-2 px-4 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {doneCount > 0 && pendingCount === 0
                  ? 'All processed'
                  : `Process ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
