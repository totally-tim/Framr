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
      className="sr-only"
      disabled={disabled}
      aria-describedby={`${descId}${error ? ` ${errorId}` : ''}`}
    />
  );

  if (hasImages) {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`
          relative flex items-center gap-3 px-4 py-3
          border-2 border-dashed rounded-lg
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 drop-zone-active'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {fileInput}
        <label
          htmlFor={inputId}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          className={`absolute inset-0 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-lg`}
          aria-label="Add more images"
        >
          <span className="sr-only">Add more images</span>
        </label>

        <div className={`
          p-1.5 rounded-full flex-shrink-0
          ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}
        `} aria-hidden="true">
          <svg
            className={`w-4 h-4 ${isDragging ? 'text-blue-500' : 'text-gray-500 dark:text-gray-300'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
            {isDragging && dragCount > 0
              ? `Drop ${dragCount} file${dragCount !== 1 ? 's' : ''} here`
              : 'Add more images'}
          </p>
          <p id={descId} className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Drop or click to browse
          </p>
        </div>

        {error && (
          <p id={errorId} className="text-xs text-amber-700 dark:text-amber-300 flex-shrink-0" role="status">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={`
        relative flex flex-col items-center justify-center
        min-h-[300px] md:min-h-[400px]
        border-2 border-dashed rounded-xl
        transition-all duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 drop-zone-active'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      {fileInput}
      <label
        htmlFor={inputId}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`absolute inset-0 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-xl`}
        aria-label="Drop images here, or click to browse"
      >
        <span className="sr-only">Drop images here, or click to browse</span>
      </label>

      <div className="flex flex-col items-center gap-4 p-8 text-center pointer-events-none">
        <div className={`
          p-5 rounded-full transition-colors duration-200
          ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}
        `} aria-hidden="true">
          <svg
            className={`w-14 h-14 transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-gray-500 dark:text-gray-300'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {isDragging
              ? (dragCount > 0 ? `Drop ${dragCount} image${dragCount !== 1 ? 's' : ''} here` : 'Drop images here')
              : 'Drop images here or click to browse'}
          </p>
          <p id={descId} className="text-sm text-gray-600 dark:text-gray-300">
            Drag &amp; drop or click to select from your device
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supports JPEG, PNG, TIFF, WebP
          </p>
        </div>

        {error && (
          <p id={errorId} className="text-sm text-amber-700 dark:text-amber-300 mt-2" role="status">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
