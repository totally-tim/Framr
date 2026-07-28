# Global keyboard shortcuts defer to any control that already handled the key

Framr's global shortcuts (process, remove, navigate, deselect) are bound to `window` so they work
with nothing in particular focused. That made them fire *in addition to* the control the user was
actually operating: one `Delete` keypress removed the focused queue row AND the selected image,
an arrow key inside any radiogroup changed the group's value AND dragged the image selection with
it, and an `Escape` cancelling a reorder drag also blanked the preview.

The window handler in `src/hooks/useKeyboardShortcuts.ts` now bails on `e.defaultPrevented`
before any of its branches. Every control that owns one of these keys - queue rows, `Segment`,
`PositionGrid` - already calls `preventDefault()` before acting, and React attaches its listener
at the root container, which sits below `window`, so that call has landed by the time the global
handler runs.

## Considered options

Guarding on the event's origin instead (`e.target.closest('[role="listbox"]')`) was the first
proposal. It was rejected because it only covered the queue: the same leak existed in `Segment`
and `PositionGrid`, and a container allowlist has to be extended every time a new keyboard control
is added - which is exactly how this bug arrived. Adding `stopPropagation()` at each handled
branch works too, but it is N call sites that must all remember, rather than one rule.

## Consequences

This is a protocol, not a list: a control that marks a key handled is covered the day it is
written, without this file learning about it. The corollary is that **a control which handles a
key must call `preventDefault()`**, or the global shortcut will fire underneath it.

`Cmd`/`Ctrl+Enter` deliberately survives, because no control claims it - the queue row handler
bails out of its `Enter` case when a modifier is held rather than preventing the default.

Two things this does NOT fix, and should not be assumed to: pressing `Delete` while focus sits on
a control that never handles `Delete` (a colour swatch, a segment radio) still removes the
selected image, because nothing called `preventDefault()`. That behaviour predates this decision.

Do not remove the guard as redundant. It reads like a no-op and is not - see
`src/hooks/useKeyboardShortcuts.ts` for the reasoning in situ.
