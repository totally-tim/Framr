import type { ImageFile } from '../types';

interface MobileActionBarProps {
  images: ImageFile[];
  isProcessing: boolean;
  progress: number;
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
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-gray-900 border-t shadow-lg safe-bottom z-40">
      {/* Progress bar when processing */}
      {isProcessing && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        {/* Images button */}
        <button
          onClick={onOpenImages}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="View images"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">{imageCount}</span>
        </button>

        {/* Controls button */}
        <button
          onClick={onOpenControls}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open controls"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* Process/Cancel button - takes remaining space */}
        <div className="flex-1">
          {isProcessing ? (
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          ) : (
            <button
              onClick={onProcess}
              disabled={!hasImages || pendingCount === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {doneCount > 0 && pendingCount === 0
                  ? 'All Done!'
                  : `Process ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
