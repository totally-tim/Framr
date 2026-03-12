import { useState, useCallback, useRef } from 'react';
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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
      setError(null);
      const count = e.dataTransfer.items?.length ?? 0;
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
      setError(`${invalidCount} file(s) were skipped (unsupported format)`);
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
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [processFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;

    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      processFiles(imageFiles);
    }
  }, [disabled, processFiles]);

  const sharedInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/tiff,image/webp,.jpg,.jpeg,.png,.tiff,.tif,.webp"
      multiple
      onChange={handleInputChange}
      className="hidden"
      disabled={disabled}
    />
  );

  const sharedHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onClick: handleClick,
    onPaste: handlePaste,
    tabIndex: disabled ? -1 : 0,
    role: 'button' as const,
  };

  if (hasImages) {
    // Compact add-more state
    return (
      <div
        {...sharedHandlers}
        aria-label="Drop images here or click to add more"
        className={`
          relative flex items-center gap-3 px-4 py-3
          border-2 border-dashed rounded-lg
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 drop-zone-active'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {sharedInput}

        <div className={`
          p-1.5 rounded-full flex-shrink-0
          ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}
        `}>
          <svg
            className={`w-4 h-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {isDragging && dragCount > 0
              ? `Drop ${dragCount} file${dragCount !== 1 ? 's' : ''} here`
              : 'Add more images'}
          </p>
          {!isDragging && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              Drop or click to browse
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex-shrink-0">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Prominent empty state
  return (
    <div
      {...sharedHandlers}
      aria-label="Drop images here or click to select"
      className={`
        relative flex flex-col items-center justify-center
        min-h-[300px] md:min-h-[400px]
        border-2 border-dashed rounded-xl
        transition-all duration-200 cursor-pointer
        ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 drop-zone-active'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {sharedInput}

      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className={`
          p-5 rounded-full
          transition-colors duration-200
          ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}
        `}>
          <svg
            className={`w-14 h-14 transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
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
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            {isDragging
              ? (dragCount > 0 ? `Drop ${dragCount} image${dragCount !== 1 ? 's' : ''} here` : 'Drop images here')
              : 'Drop images here or click to browse'
            }
          </p>
          {!isDragging && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag &amp; drop or click to select from your device
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Supports JPEG, PNG, TIFF, WebP
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
