import { useState, useEffect, useCallback, useRef } from 'react';
import { useMountThroughExit } from './motion';
import { cx } from './ui';
import { SECTION_HEADING } from './typography';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modKey = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { keys: [`${modKey}`, 'Enter'], description: 'Process images' },
  { keys: ['↑', '↓'], description: 'Navigate image queue' },
  { keys: [isMac ? '⌫' : 'Del'], description: 'Remove selected image' },
  { keys: ['Esc'], description: 'Deselect image' },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popover = useMountThroughExit(open, popoverRef);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    // Use capture phase to intercept before global shortcuts
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, close]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border text-sm font-semibold text-muted transition-[background-color,border-color,color] duration-fast ease-out focus-visible:outline-2 focus-visible:outline-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {popover.mounted && (
        <>
          {/* Click-outside catcher. It goes the moment the close is requested,
              so an exiting popover never swallows the next click. */}
          {open && <div className="fixed inset-0 z-40" onClick={close} />}
          {/* Anchored origin: this hangs BELOW the trigger, so it arrives from
              the top edge it is pinned to. It used to run a `slide-up`
              keyframe whose translateY(100%) start belonged to a drawer at the
              bottom of the viewport - here it threw the panel a full height
              downward first. A keyframe also cannot reverse, which is why there
              was no exit; a transition does both directions from one list. That
              rule is deleted now, this was its only consumer.

              The floating-surface recipe - `bg-surface-raised` + `rounded-lg` +
              `border-border` + `shadow-lg dark:shadow-none` - is the same one
              Toast, MobileDrawer and MobileActionBar carry, and all four parts
              travel together. This popover was missing the shadow, which is the
              half that matters in LIGHT mode: `surface` is 99% L and
              `surface-raised` is 99.5%, so the step under it measures 1.017:1
              and a hairline over the header was the entire separation. Dark mode
              drops the shadow, because a shadow against a dark background is
              invisible and reads as glow when forced, and leans on the lightness
              step (1.176:1) plus the border instead. */}
          <div
            ref={popoverRef}
            inert={!open}
            className={cx(
              'absolute right-0 top-8 z-50 w-56 rounded-lg border border-border bg-surface-raised p-4',
              'shadow-lg dark:shadow-none',
              'transition-[translate,opacity]',
              popover.shown
                ? 'translate-y-0 opacity-100 duration-enter ease-out'
                : '-translate-y-1 opacity-0 duration-exit ease-in',
            )}
          >
            <h3 className={cx('mb-3', SECTION_HEADING)}>
              Keyboard Shortcuts
            </h3>
            <ul className="space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.description} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{shortcut.description}</span>
                  {/* Keyboard hints are data voice: the key is a value the user
                      reads, not chrome copy. */}
                  <span className="flex items-center gap-1 shrink-0">
                    {shortcut.keys.map((k) => (
                      <kbd
                        key={k}
                        className="data-voice rounded-sm border border-border bg-surface-sunken px-1.5 py-0.5 text-micro text-ink"
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
