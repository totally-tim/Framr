# Framr

A browser-based tool that adds borders and text overlays to photographs. Everything runs
client-side. This glossary records the terms that mean something specific inside Framr and
would otherwise be used loosely.

## Language

**Chrome palette**:
The set of colours the application's own interface is drawn in - surfaces, rules, text, and
the accent. Cool-tinted and low-chroma so it does not shift how the user perceives the
photograph it surrounds. Lives in `@theme` in `src/styles/globals.css`.
_Avoid_: UI colours, theme colours, app colours

**Image palette**:
The set of colours a user can apply *to* a photograph - border colours, canvas backgrounds,
and text-overlay colours. Chosen to read on a photographic image, and deliberately unrelated
to the chrome palette. Lives in `src/utils/colorUtils.ts`.
_Avoid_: preset colours, swatch colours, output colours

The two palettes never borrow from each other. A chrome token that reaches the image palette
means the framework's defaults are ending up in the user's photographs; an image colour that
reaches the chrome means the instrument is competing with its subject.

**Accent budget**:
The rule that the chrome palette's single accent occupies 3% or less of any viewport, and has
exactly two jobs - the focus ring and the one primary action. Selection is never expressed as
an accent fill.
_Avoid_: brand colour usage, primary colour rules

**Data voice**:
The monospace, tabular-figure treatment applied to every value a user reads or compares -
dimensions, hex colours, percentages, file sizes, zoom level, keyboard hints. Distinct from
chrome text, which uses the system UI stack.
_Avoid_: mono styling, code font
