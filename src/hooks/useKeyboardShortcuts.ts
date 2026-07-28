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

      /* Someone nearer the key already dealt with it.
       *
       * These are last-resort shortcuts, bound to `window` so they work with
       * nothing in particular focused. Every control that owns one of these
       * keys - the queue rows, Segment, PositionGrid - calls `preventDefault()`
       * before acting, and React attaches its listener at the root container,
       * which is below `window`, so that call has already landed by the time
       * this runs. Without the check both handlers fire: one Delete removed the
       * focused image AND the selected one, an arrow inside any radiogroup
       * changed the group's value AND dragged the image selection along with
       * it, and an Escape cancelling a reorder drag also blanked the preview.
       *
       * Deliberately a protocol rather than a list of exempt containers: a
       * control that marks a key handled is covered on the day it is written,
       * without this file having to learn about it. Cmd/Ctrl+Enter survives
       * because no control claims it - the row handler bails out of its
       * Enter case on a modifier rather than preventing the default. */
      if (e.defaultPrevented) return;

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
