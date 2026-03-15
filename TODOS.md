# TODOs

## Expand test coverage

**What:** vitest + jsdom are installed. Unit tests exist for `fonts.ts`, `textOverlay.ts`, `dateFormat.ts`, and `exif.ts`. Expand coverage to components, hooks, and integration tests.

**Where to start:**
- Priority 1: `useImageProcessor` — test re-entry guard, cancellation flow, progress state
- Priority 2: `useCustomPresets` — test loadFromStorage validation, renamePreset empty guard
- Priority 3: `DownloadPanel` — test condition logic (error state message, download behaviors)
- Priority 4: `TextOverlayControls` — test font picker interactions, date stamp buttons, position grid
- Priority 5: `PreviewCanvas` — test font loading effect, canvas rendering calls
- Priority 6: Worker integration tests — test font loading in worker context

**Complexity notes:** The image processor hook uses Web Workers and Canvas APIs that need mocking. Consider `vitest-webworker` for worker tests and canvas mocking via jsdom or `jest-canvas-mock`.

**Depends on:** Nothing — can be done independently.

## Letter spacing control

**What:** Add letter spacing support to text overlay.

**Why deferred:** Canvas `letterSpacing` has limited browser support. P3, effort: S.

## Multiple text layers

**What:** Support multiple text overlays per image (array of TextOverlaySettings, UI for managing layers).

**Why deferred:** Requires significant UI/state refactoring. P2, effort: L.

## Custom x/y drag positioning

**What:** Allow dragging text to arbitrary positions on the preview canvas.

**Why deferred:** Requires mouse interaction on preview canvas. P2, effort: L.

## Text effects (gradient fill, outline-only, emboss)

**What:** Additional text rendering modes beyond solid fill + shadow.

**Why deferred:** Each is its own render mode. P3, effort: M each.

## Text templates / quick-fill

**What:** Additional preset text buttons beyond date stamp ("@username", copyright, custom templates).

**Why deferred:** Generic templates need a design pass. P3, effort: S.

## Per-image date stamping in batch mode

**What:** When processing multiple images, each image gets its own EXIF date instead of sharing the same text.

**Why deferred:** Requires making textOverlay.text per-image rather than global. P2, effort: M.
