import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onProcess: () => void;
  onRemoveSelected: () => void;
  onNavigate: (direction: 'up' | 'down') => void;
  onDeselect: () => void;
  onShowHelp?: () => void;
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
  onShowHelp,
  hasImages,
  selectedId,
  isProcessing,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      // `?` is reachable globally — even with no images loaded.
      if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && onShowHelp) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      if (!hasImages) return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing) onProcess();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if (e.repeat) return; // avoid mass-deletion on key hold
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
  }, [onProcess, onRemoveSelected, onNavigate, onDeselect, onShowHelp, hasImages, selectedId, isProcessing]);
}
