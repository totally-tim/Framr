import { useState, useCallback } from 'react';
import type { ImageFile, ProcessingResult } from '../types';
import { downloadSingle, downloadAsZip, generateZipFilename } from '../utils/downloadUtils';

interface DownloadPanelProps {
  images: ImageFile[];
  results: ProcessingResult[];
  isProcessing: boolean;
  progress: number;
  onProcess: () => void;
  onCancel: () => void;
}

export function DownloadPanel({
  images,
  results,
  isProcessing,
  progress,
  onProcess,
  onCancel,
}: DownloadPanelProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const pendingCount = images.filter((img) => img.status === 'pending').length;
  const doneCount = images.filter((img) => img.status === 'done').length;
  const errorCount = images.filter((img) => img.status === 'error').length;

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;

    if (results.length === 1) {
      downloadSingle(results[0].blob, results[0].filename);
      return;
    }

    setIsZipping(true);
    setZipProgress(0);

    try {
      await downloadAsZip(results, generateZipFilename(), (progress) => {
        setZipProgress(progress);
      });
    } catch (error) {
      console.error('ZIP creation failed:', error);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [results]);

  const handleDownloadZip = useCallback(async () => {
    if (results.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    try {
      await downloadAsZip(results, generateZipFilename(), (progress) => {
        setZipProgress(progress);
      });
    } catch (error) {
      console.error('ZIP creation failed:', error);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [results]);

  return (
    <div className="space-y-4">
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Processing...</span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {!isProcessing && pendingCount > 0 && (
        <button
          onClick={onProcess}
          disabled={images.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Process {pendingCount === images.length ? 'All' : pendingCount} Image{pendingCount !== 1 ? 's' : ''}
        </button>
      )}

      {doneCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              {doneCount} image{doneCount !== 1 ? 's' : ''} ready
            </span>
            {errorCount > 0 && (
              <span className="text-red-500">
                {errorCount} failed
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={isZipping}
              className="btn-primary flex items-center justify-center gap-2"
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
                className="btn-secondary flex items-center justify-center gap-2"
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
              <div className="text-xs text-gray-500 text-center">Creating ZIP...</div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!isProcessing && pendingCount === 0 && doneCount === 0 && images.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          All images processed
        </p>
      )}
    </div>
  );
}
