import { useState } from 'react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modKey = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { keys: [`${modKey}`, 'Enter'], description: 'Process images' },
  { keys: ['↑', '↓'], description: 'Navigate image queue' },
  { keys: ['Del'], description: 'Remove selected image' },
  { keys: ['Esc'], description: 'Deselect image' },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 rounded-full border text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-8 z-50 bg-white dark:bg-gray-900 border rounded-xl shadow-xl p-4 w-56 animate-slide-up">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Keyboard Shortcuts
            </h3>
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
