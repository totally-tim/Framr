import { useCallback } from 'react';
import type { ImageFile } from '../types';

interface ImageQueueProps {
  images: ImageFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  onClearAll: () => void;
}

export function ImageQueue({
  images,
  selectedId,
  onSelect,
  onRemove,
  onAddMore,
  onClearAll,
}: ImageQueueProps) {
  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onRemove(id);
  }, [onRemove]);

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

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => onSelect(image.id)}
            className={`
              group relative flex items-center gap-3 p-2 rounded-lg cursor-pointer
              transition-all duration-150
              ${selectedId === image.id
                ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
            role="button"
            aria-selected={selectedId === image.id}
            tabIndex={0}
          >
            <div className="relative flex-shrink-0">
              <img
                src={image.thumbnailUrl}
                alt={image.name}
                className="w-12 h-12 object-cover rounded"
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
        ))}
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
