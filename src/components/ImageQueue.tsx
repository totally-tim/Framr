import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageFile } from '../types';

interface ImageQueueProps {
  images: ImageFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  onClearAll: () => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
}

export function ImageQueue({
  images,
  selectedId,
  onSelect,
  onRemove,
  onAddMore,
  onClearAll,
  onReorderImages,
}: ImageQueueProps) {
  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onRemove(id);
  }, [onRemove]);

  // Desktop DnD state
  const dragIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Touch DnD state
  const touchDragIndexRef = useRef<number | null>(null);
  const touchDragOverIndexRef = useRef<number | null>(null);
  const [touchDraggingIndex, setTouchDraggingIndex] = useState<number | null>(null);
  const [touchDragOverIndex, setTouchDragOverIndex] = useState<number | null>(null);
  const isDraggingTouchRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Prevent scroll during touch drag (non-passive listener required)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => {
      if (isDraggingTouchRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, []);

  // Desktop drag handlers
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
    if (fromIndex !== null && fromIndex !== toIndex) {
      onReorderImages(fromIndex, toIndex);
    }
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [onReorderImages]);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  // Touch drag handlers
  const handleTouchStart = useCallback((_e: React.TouchEvent, index: number) => {
    touchDragIndexRef.current = index;
    touchDragOverIndexRef.current = index;
    isDraggingTouchRef.current = true;
    setTouchDraggingIndex(index);
    setTouchDragOverIndex(index);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingTouchRef.current) return;
    const touch = e.touches[0];
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
    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onReorderImages(fromIndex, toIndex);
    }
    touchDragIndexRef.current = null;
    touchDragOverIndexRef.current = null;
    isDraggingTouchRef.current = false;
    setTouchDraggingIndex(null);
    setTouchDragOverIndex(null);
  }, [onReorderImages]);

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'done':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200">
          Images ({images.length})
        </h3>
        {images.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
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
      >
        {images.map((image, index) => {
          const isDragged = index === draggingIndex || index === touchDraggingIndex;
          const isDropTarget =
            (index === dragOverIndex && dragOverIndex !== draggingIndex) ||
            (index === touchDragOverIndex && touchDragOverIndex !== touchDraggingIndex);

          return (
            <div
              key={image.id}
              data-drag-index={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onClick={() => onSelect(image.id)}
              className={[
                'group relative flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing',
                'transition-all duration-150 select-none',
                isDropTarget ? 'border-t-2 border-blue-500' : 'border-t-2 border-transparent',
                isDragged ? 'opacity-40' : 'opacity-100',
                image.status === 'processing'
                  ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-400 animate-pulse'
                  : selectedId === image.id
                    ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
              role="button"
              aria-selected={selectedId === image.id}
              tabIndex={0}
            >
              {/* Drag handle indicator */}
              <div className="flex-shrink-0 text-gray-300 dark:text-gray-600 touch-none pointer-events-none">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </div>

              <div className="relative flex-shrink-0">
                <img
                  src={image.thumbnailUrl}
                  alt={image.name}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {image.originalWidth} x {image.originalHeight}
                </p>
                {image.error && (
                  <p className="text-xs text-red-500 truncate">{image.error}</p>
                )}
              </div>

              <button
                onClick={(e) => handleRemove(e, image.id)}
                className={`
                  flex-shrink-0 p-1 rounded-full
                  opacity-0 group-hover:opacity-100
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  transition-all duration-150
                `}
                aria-label={`Remove ${image.name}`}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t">
        <button
          onClick={onAddMore}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
            border border-dashed border-gray-300 dark:border-gray-600
            hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800
            text-sm text-gray-600 dark:text-gray-300
            transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add more images
        </button>
      </div>
    </div>
  );
}
