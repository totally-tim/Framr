import { useEffect, useRef, useState } from 'react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modKey = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { keys: [`${modKey}`, 'Enter'], description: 'Process images' },
  { keys: ['↑', '↓'], description: 'Navigate image queue' },
  { keys: [isMac ? '⌫' : 'Del'], description: 'Remove selected image' },
  { keys: ['Esc'], description: 'Deselect image' },
  { keys: ['?'], description: 'Show this dialog' },
];

interface KeyboardShortcutsHelpProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ isOpen: controlledOpen, onOpenChange }: KeyboardShortcutsHelpProps = {}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Support both controlled and uncontrolled use: when callers pass isOpen +
  // onOpenChange we honor them; otherwise we manage state internally so the
  // component still works standalone.
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    // Focus the close button on open so keyboard users land somewhere predictable.
    queueMicrotask(() => closeBtnRef.current?.focus());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore focus to whatever opened the dialog.
      lastFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-11 h-11 md:w-9 md:h-9 rounded-full border text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:ring-offset-2"
        aria-label="Keyboard shortcuts"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute right-0 top-12 z-50 bg-white dark:bg-gray-900 border rounded-xl shadow-xl p-4 w-64 animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Keyboard Shortcuts
              </h3>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded -mr-1 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500"
                aria-label="Close shortcuts dialog"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.description} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{shortcut.description}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {shortcut.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border rounded"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
