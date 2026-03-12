import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onProcess: () => void;
  onRemoveSelected: () => void;
  onNavigate: (direction: 'up' | 'down') => void;
  onDeselect: () => void;
  hasImages: boolean;
  selectedId: string | null;
  isProcessing: boolean;
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts({
  onProcess,
  onRemoveSelected,
  onNavigate,
  onDeselect,
  hasImages,
  selectedId,
  isProcessing,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;
      if (!hasImages) return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing) onProcess();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        onRemoveSelected();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate('up');
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate('down');
        return;
      }

      if (e.key === 'Escape' && selectedId) {
        e.preventDefault();
        onDeselect();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onProcess, onRemoveSelected, onNavigate, onDeselect, hasImages, selectedId, isProcessing]);
}
