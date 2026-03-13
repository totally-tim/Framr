# TODOs

## Add test infrastructure

**What:** Set up vitest + jsdom and write unit tests for hooks and key interactions.

**Why:** The project has zero tests. The bug hunt found 17 bugs that would have been caught by basic unit tests (re-entry guards, validation, state management). Without tests, regressions are invisible until users hit them.

**Where to start:**
- Install vitest + @testing-library/react + jsdom
- Priority 1: `useImageProcessor` — test re-entry guard, cancellation flow, progress state
- Priority 2: `useCustomPresets` — test loadFromStorage validation, renamePreset empty guard
- Priority 3: `DownloadPanel` — test condition logic (error state message, download behaviors)

**Complexity notes:** The image processor hook uses Web Workers and Canvas APIs that need mocking. Consider `vitest-webworker` for worker tests and canvas mocking via jsdom or `jest-canvas-mock`.

**Depends on:** Nothing — can be done independently.
