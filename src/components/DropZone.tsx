import { useState, useCallback, useRef } from 'react';
import { isValidImageType } from '../utils/imageUtils';
import { cx } from './ui';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  hasImages?: boolean;
}

/**
 * The drop target, in two sizes: the prominent empty state and the compact
 * add-more strip that sits above the queue. It is the only "add images"
 * affordance in the sidebar - the queue used to end in a second button with the
 * same label.
 *
 * Drag-active is a single, non-looping state change: the dashed rule goes solid
 * and picks up the selection hairline, and the surface lifts. It used to run an
 * infinite border pulse, which pulled the eye for as long as a file was held
 * over the window and told the user nothing the first frame had not.
 */
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    // Cmd/Ctrl+Enter is Process, and it stays global so it fires wherever focus
    // sits - including here. Bailing rather than preventing is the protocol
    // every control that shares a key with a shortcut follows (see
    // `useKeyboardShortcuts`, and the queue row's own Enter case): that handler
    // skips anything already `defaultPrevented`, so opening the file picker
    // here would swallow a Process the shortcuts help advertises.
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
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
      // The programmatic click below would otherwise bubble back into the
      // container's own click handler and re-open the picker.
      onClick={(e) => e.stopPropagation()}
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
    onKeyDown: handleKeyDown,
    onPaste: handlePaste,
    tabIndex: disabled ? -1 : 0,
    role: 'button' as const,
    'aria-disabled': disabled || undefined,
  };

  /* Shared chassis. The border style flips dashed -> solid on drag-active,
     which is not an animatable property, so the change lands on the first
     frame and then holds. Colour and surface carry the fast-feedback band. */
  const dropSurface = cx(
    'relative cursor-pointer border-2',
    'transition-[background-color,border-color] duration-fast ease-out',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    isDragging
      ? 'border-solid border-accent-hairline bg-surface-selected'
      : cx(
          'border-dashed border-border',
          '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover'
        ),
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const iconWell = cx(
    'rounded-full transition-[background-color] duration-fast ease-out',
    isDragging ? 'bg-surface-raised' : 'bg-surface-sunken'
  );

  const iconTone = cx(
    'transition-[color] duration-fast ease-out',
    isDragging ? 'text-ink' : 'text-muted'
  );

  if (hasImages) {
    // Compact add-more state
    return (
      <div
        {...sharedHandlers}
        aria-label="Drop images here or click to add more"
        className={cx(dropSurface, 'flex items-center gap-3 px-4 py-3 rounded-md')}
      >
        {sharedInput}

        <div className={cx(iconWell, 'p-2 flex-shrink-0')}>
          <svg className={cx(iconTone, 'w-4 h-4')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink truncate">
            {isDragging && dragCount > 0
              ? `Drop ${dragCount} file${dragCount !== 1 ? 's' : ''} here`
              : 'Add more images'}
          </p>
          {!isDragging && (
            <p className="text-xs text-muted truncate">
              Drop or click to browse
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs text-warning flex-shrink-0">
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
      className={cx(
        dropSurface,
        'flex flex-col items-center justify-center rounded-lg',
        'min-h-[300px] md:min-h-[400px]'
      )}
    >
      {sharedInput}

      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className={cx(iconWell, 'p-5')}>
          <svg className={cx(iconTone, 'w-14 h-14')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-ink">
            {isDragging
              ? (dragCount > 0 ? `Drop ${dragCount} image${dragCount !== 1 ? 's' : ''} here` : 'Drop images here')
              : 'Drop images here or click to browse'
            }
          </p>
          {!isDragging && (
            <>
              <p className="text-sm text-muted">
                Drag &amp; drop or click to select from your device
              </p>
              <p className="text-xs text-muted">
                Supports JPEG, PNG, TIFF, WebP
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-warning mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
