import { useState, useCallback, useRef } from 'react';
import { isValidImageType } from '../utils/imageUtils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesSelected, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
      setError(null);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
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

  return (
    <div
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
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onPaste={handlePaste}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label="Drop images here or click to select"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/tiff,image/webp,.jpg,.jpeg,.png,.tiff,.tif,.webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className={`
          p-4 rounded-full
          ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}
        `}>
          <svg
            className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
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
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {isDragging ? 'Drop images here' : 'Drop images here'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to select files
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Supports JPEG, PNG, TIFF, WebP
          </p>
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
