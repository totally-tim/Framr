import { useState, useCallback, useRef, useId } from 'react';
import { isValidImageType } from '../utils/imageUtils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  hasImages?: boolean;
}

export function DropZone({ onFilesSelected, disabled = false, hasImages = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const descId = useId();
  const errorId = useId();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
      setError(null);
      const count = e.dataTransfer.items?.length || e.dataTransfer.files?.length || 0;
      setDragCount(count);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
      setDragCount(0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(isValidImageType);
    const invalidCount = fileArray.length - validFiles.length;

    if (invalidCount > 0) {
      setError(`${invalidCount} file${invalidCount !== 1 ? 's' : ''} skipped — unsupported format`);
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCount(0);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) processFiles(files);
  }, [disabled, processFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  }, [processFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) processFiles(imageFiles);
  }, [disabled, processFiles]);

  const triggerPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPicker();
    }
  }, [disabled, triggerPicker]);

  const fileInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept="image/jpeg,image/png,image/tiff,image/webp,.jpg,.jpeg,.png,.tiff,.tif,.webp"
      multiple
      onChange={handleInputChange}
      className="hidden"
      tabIndex={-1}
      disabled={disabled}
    />
  );

  if (hasImages) {
    // Compact "add more" tile — visually quieter, still a film-strip echo.
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`
          relative flex items-center gap-3 px-4 py-3
          border border-dashed transition-colors duration-200
          ${isDragging
            ? 'border-safelight-500 bg-safelight-50 dark:bg-safelight-700/10 drop-zone-active'
            : 'border-paper-400 dark:border-darkroom-400 hover:border-ink-100 dark:hover:border-darkroom-500 hover:bg-paper-100 dark:hover:bg-darkroom-200/50'
          }
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {fileInput}
        <label
          htmlFor={inputId}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          className={`absolute inset-0 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''} focus:outline-none`}
          aria-label="Add more images"
          aria-describedby={`${descId}${error ? ` ${errorId}` : ''}`}
        >
          <span className="sr-only">Add more images</span>
        </label>

        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-paper-400 dark:border-darkroom-400" aria-hidden="true">
          <svg
            className={`w-3.5 h-3.5 ${isDragging ? 'text-safelight-600' : 'text-ink-100 dark:text-darkroom-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-mono uppercase tracking-[0.15em] truncate ${isDragging ? 'text-safelight-600' : 'text-ink-900 dark:text-paper-50'}`}>
            {isDragging && dragCount > 0
              ? `Drop ${dragCount} file${dragCount !== 1 ? 's' : ''}`
              : 'Add more'}
          </p>
          <p id={descId} className="text-xs text-ink-100 dark:text-darkroom-500 truncate">
            Drop or click to browse
          </p>
        </div>

        {error && (
          <p id={errorId} className="text-xs text-safelight-600 dark:text-safelight-400 flex-shrink-0 font-mono" role="status">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Hero empty state — film-strip drop zone with sprocket holes.
  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={`
        relative transition-colors duration-300
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      {fileInput}
      <label
        htmlFor={inputId}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`absolute inset-0 z-20 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:ring-offset-4`}
        aria-label="Drop images here, or click to browse"
        aria-describedby={`${descId}${error ? ` ${errorId}` : ''}`}
      >
        <span className="sr-only">Drop images here, or click to browse</span>
      </label>

      {/* Top sprocket edge */}
      <div
        className={`h-6 bg-ink-900 dark:bg-darkroom-0 sprocket-edge ${isDragging ? 'is-active' : ''}`}
        aria-hidden="true"
      />

      {/* Film body */}
      <div
        className={`
          relative bg-ink-900 dark:bg-darkroom-0 border-x border-paper-300/20 dark:border-darkroom-400/30
          min-h-[360px] md:min-h-[440px]
          flex flex-col items-center justify-center
          overflow-hidden
        `}
      >
        {/* Inner paper "frame" — what the photographer sees when no negatives are loaded. */}
        <div
          className={`
            relative mx-6 my-6 md:mx-12 md:my-10 flex-1 self-stretch
            border transition-colors duration-200
            ${isDragging
              ? 'border-safelight-500 drop-zone-active bg-safelight-50/5'
              : 'border-paper-300/30 dark:border-darkroom-400/40 group-hover:border-paper-300/50'
            }
            flex flex-col items-center justify-center
          `}
        >
          {/* Decorative corner crops */}
          <Crop className="top-2 left-2" />
          <Crop className="top-2 right-2 rotate-90" />
          <Crop className="bottom-2 right-2 rotate-180" />
          <Crop className="bottom-2 left-2 -rotate-90" />

          <div className="flex flex-col items-center gap-5 px-6 py-12 text-center pointer-events-none">
            <span
              className="text-2xs font-mono uppercase tracking-[0.35em] text-safelight-500"
              aria-hidden="true"
            >
              {isDragging ? 'Holding negative…' : 'Drop negatives here'}
            </span>

            <h2 className="font-display text-3xl md:text-4xl font-light text-paper-50 leading-[1.05] tracking-tighter max-w-md">
              {isDragging
                ? (dragCount > 0 ? `Loading ${dragCount} image${dragCount !== 1 ? 's' : ''}` : 'Loading images')
                : <>Drag a photograph<br />onto the frame</>}
            </h2>

            <p id={descId} className="text-sm text-paper-300/80 max-w-xs">
              Or <span className="underline underline-offset-2 decoration-paper-300/50">click anywhere</span> to browse your device. Everything stays on this machine — no upload, no account, no trace.
            </p>

            <div className="flex items-center gap-3 mt-2 font-mono text-2xs uppercase tracking-[0.2em] text-paper-300/60">
              <span>JPEG</span>
              <span className="w-1 h-1 rounded-full bg-paper-300/30" aria-hidden="true" />
              <span>PNG</span>
              <span className="w-1 h-1 rounded-full bg-paper-300/30" aria-hidden="true" />
              <span>TIFF</span>
              <span className="w-1 h-1 rounded-full bg-paper-300/30" aria-hidden="true" />
              <span>WebP</span>
            </div>
          </div>
        </div>

        {/* Caption strip — light-leak gradient on drag */}
        <div className="px-6 md:px-12 py-3 flex items-center justify-between border-t border-paper-300/15 dark:border-darkroom-400/30">
          <span className="font-mono text-2xs uppercase tracking-[0.2em] text-paper-300/50">
            Framr · iso 100
          </span>
          <span className="font-mono text-2xs uppercase tracking-[0.2em] text-paper-300/50">
            {isDragging ? '— exposing —' : 'ready'}
          </span>
        </div>
      </div>

      {/* Bottom sprocket edge */}
      <div
        className={`h-6 bg-ink-900 dark:bg-darkroom-0 sprocket-edge ${isDragging ? 'is-active' : ''}`}
        aria-hidden="true"
      />

      {error && (
        <p id={errorId} className="mt-3 text-sm text-safelight-600 dark:text-safelight-400 font-mono text-center" role="status">
          {error}
        </p>
      )}
    </div>
  );
}

function Crop({ className }: { className?: string }) {
  return (
    <svg
      className={`absolute w-3 h-3 text-paper-300/40 ${className ?? ''}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      aria-hidden="true"
    >
      <path d="M0 4 V0 H4" />
    </svg>
  );
}
