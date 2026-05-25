import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ImageFile } from '../types';

interface ImageQueueProps {
  images: ImageFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  onAddMore: () => void;
  onClearAll: () => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
}

function ImageQueueImpl({
  images,
  selectedId,
  onSelect,
  onRemove,
  onRetry,
  onAddMore,
  onClearAll,
  onReorderImages,
}: ImageQueueProps) {
  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onRemove(id);
  }, [onRemove]);

  const handleRetry = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onRetry?.(id);
  }, [onRetry]);

  const dragIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const touchDragIndexRef = useRef<number | null>(null);
  const touchDragOverIndexRef = useRef<number | null>(null);
  const [touchDraggingIndex, setTouchDraggingIndex] = useState<number | null>(null);
  const [touchDragOverIndex, setTouchDragOverIndex] = useState<number | null>(null);
  const isDraggingTouchRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      if (isDraggingTouchRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex !== null && fromIndex !== toIndex) onReorderImages(fromIndex, toIndex);
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [onReorderImages]);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    touchDragIndexRef.current = index;
    touchDragOverIndexRef.current = index;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingTouchRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!isDraggingTouchRef.current && touchStartPosRef.current) {
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) < 10) return;
      isDraggingTouchRef.current = true;
      setTouchDraggingIndex(touchDragIndexRef.current);
    }
    if (!isDraggingTouchRef.current) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = el?.closest('[data-drag-index]');
    if (itemEl) {
      const idx = parseInt(itemEl.getAttribute('data-drag-index') ?? '-1', 10);
      if (idx >= 0) {
        touchDragOverIndexRef.current = idx;
        setTouchDragOverIndex(idx);
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const fromIndex = touchDragIndexRef.current;
    const toIndex = touchDragOverIndexRef.current;
    if (isDraggingTouchRef.current && fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onReorderImages(fromIndex, toIndex);
    }
    touchDragIndexRef.current = null;
    touchDragOverIndexRef.current = null;
    isDraggingTouchRef.current = false;
    touchStartPosRef.current = null;
    setTouchDraggingIndex(null);
    setTouchDragOverIndex(null);
  }, [onReorderImages]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  }, [onSelect]);

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'processing':
        return (
          <div
            className="w-4 h-4 border-2 border-ink-900 dark:border-paper-50 border-t-transparent rounded-full motion-safe:animate-spin"
            role="img"
            aria-label="Processing"
          />
        );
      case 'done':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Done">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" role="img" aria-label="Failed">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <h3 className="font-mono text-2xs uppercase tracking-[0.2em] text-ink-100 dark:text-darkroom-500">
          Negatives · {images.length}
        </h3>
        {images.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-2xs font-mono uppercase tracking-wider text-ink-100 dark:text-darkroom-500 hover:text-safelight-600 dark:hover:text-safelight-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:rounded px-1"
            aria-label="Clear all images"
          >
            Clear all
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="listbox"
        aria-label="Loaded images"
        aria-activedescendant={selectedId ? `img-row-${selectedId}` : undefined}
      >
        {images.map((image, index) => {
          const isDragged = index === draggingIndex || index === touchDraggingIndex;
          const isDropTarget =
            (index === dragOverIndex && dragOverIndex !== draggingIndex) ||
            (index === touchDragOverIndex && touchDragOverIndex !== touchDraggingIndex);
          const isSelected = selectedId === image.id;

          return (
            <div
              key={image.id}
              id={`img-row-${image.id}`}
              data-drag-index={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onClick={() => onSelect(image.id)}
              onKeyDown={(e) => handleRowKeyDown(e, image.id)}
              className={[
                'group relative flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing',
                'transition-all duration-150 select-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500',
                isDropTarget ? 'border-t-2 border-ink-900 dark:border-paper-50' : 'border-t-2 border-transparent',
                isDragged ? 'opacity-40' : 'opacity-100',
                image.status === 'processing'
                  ? 'bg-paper-200 dark:bg-darkroom-200 ring-2 ring-safelight-500 motion-safe:animate-pulse'
                  : isSelected
                    ? 'bg-paper-200 dark:bg-darkroom-200 ring-2 ring-ink-900 dark:ring-paper-50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
              role="option"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
            >
              {isSelected && (
                <span className="sr-only">Selected.</span>
              )}
              <div className="flex-shrink-0 text-gray-300 dark:text-gray-600 touch-none pointer-events-none" aria-hidden="true">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </div>

              <div className="relative flex-shrink-0">
                <img
                  src={image.thumbnailUrl}
                  alt=""
                  className="w-12 h-12 object-cover rounded"
                  draggable={false}
                />
                {image.status !== 'pending' && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                    {getStatusIcon(image.status)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {image.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {image.originalWidth} × {image.originalHeight}
                </p>
                {image.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 truncate" title={image.error}>{image.error}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {image.status === 'error' && onRetry && (
                  <button
                    type="button"
                    onClick={(e) => handleRetry(e, image.id)}
                    className="flex-shrink-0 p-1.5 rounded-md text-xs text-safelight-600 dark:text-safelight-400 hover:bg-paper-100 dark:hover:bg-darkroom-200 opacity-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500"
                    aria-label={`Retry ${image.name}`}
                    title="Retry"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, image.id)}
                  className="flex-shrink-0 p-2 rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500"
                  aria-label={`Remove ${image.name}`}
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t">
        <button
          type="button"
          onClick={onAddMore}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3
            border border-dashed border-paper-400 dark:border-darkroom-400
            hover:border-ink-100 dark:hover:border-darkroom-500
            hover:bg-paper-100/50 dark:hover:bg-darkroom-200/50
            text-2xs font-mono uppercase tracking-[0.18em] text-ink-100 dark:text-darkroom-500 hover:text-ink-600 dark:hover:text-paper-100
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:ring-offset-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add more
        </button>
      </div>
    </div>
  );
}

export const ImageQueue = memo(ImageQueueImpl);
