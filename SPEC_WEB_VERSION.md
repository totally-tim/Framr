# Framr - Web-Based Image Border Tool

## Specification Document

**Version:** 1.0
**Date:** January 2026
**Status:** Draft

---

## 1. Executive Summary

Framr is a browser-based image processing application that adds borders to images. It is a complete reimplementation of the BorderPy desktop application, designed to run entirely in the user's browser with zero backend requirements. The application targets professional photographers who need quick, high-quality border styling for their images.

### Key Principles
- **Zero backend** - All processing happens client-side using Canvas API and Web Workers
- **No account required** - Fresh start each session, no data collection
- **Professional quality** - Support for high-resolution images up to 100MP
- **Progressive disclosure** - Simple by default, advanced features accessible when needed

---

## 2. Target Audience

**Primary:** Professional photographers who want:
- Quick border styling for portfolio images
- Consistent aesthetic across image sets
- High-quality output without compression artifacts
- Simple tool that doesn't require installation or accounts

---

## 3. Core Features

### 3.1 Image Input
| Feature | Priority | Notes |
|---------|----------|-------|
| Drag-and-drop upload | Essential | Drop zone for files, supports multiple images |
| File picker button | Essential | Fallback for non-drag-drop users |
| Paste from clipboard | Nice-to-have | For quick single-image workflows |
| Directory selection | Nice-to-have | Select folder (where browser supports) |

**Supported formats:** JPEG, PNG, TIFF, WebP
**Max size:** No enforced limit (graceful handling up to ~250MB/100MP)

### 3.2 Border Configuration

#### Basic Mode (Default View)
| Setting | Control Type | Default |
|---------|--------------|---------|
| Border Width | Slider + input | 5% |
| Border Color | Color picker + preset swatches | White (#FFFFFF) |

#### Advanced Mode (Expandable Panel)
| Setting | Control Type | Default |
|---------|--------------|---------|
| Width Unit | Toggle (px / %) | % |
| Aspect-aware borders | Toggle | Off |
| Resize before border | Width/Height inputs | None |
| Resize unit | Toggle (px / %) | px |
| Output quality (JPEG) | Slider (1-100) | 95 |
| Output format | Dropdown | Same as input |

### 3.3 Live Preview
- **Debounced preview** - Updates 300ms after user stops adjusting settings
- **Preview canvas** - Shows scaled-down preview with border applied
- **Before/After toggle** - Quick comparison with original
- **Zoom controls** - Fit to view / 100% / custom zoom

### 3.4 Profiles (Quick Presets)
Pre-configured settings for common use cases:

| Profile Name | Border Width | Color | Notes |
|--------------|--------------|-------|-------|
| White 3% | 3% | #FFFFFF | Minimal white border |
| White 5% | 5% | #FFFFFF | Standard white border |
| White 10% | 10% | #FFFFFF | Prominent white border |
| Black 3% | 3% | #000000 | Minimal black border |
| Black 5% | 5% | #000000 | Standard black border |
| Black 10% | 10% | #000000 | Prominent black border |
| Instagram Square | Auto | #FFFFFF | Pads to 1:1 with white |
| Custom | User-defined | User-defined | Apply current settings |

Users can modify any preset and apply it without saving.

### 3.5 Batch Processing
| Feature | Description |
|---------|-------------|
| Multi-select | Select multiple images at once |
| Queue display | Show list of images to process with thumbnails |
| Progress indicator | Overall progress bar + per-image status |
| Individual download | Click to download single processed image |
| Zip download | Download all processed images as ZIP |
| Cancel processing | Stop batch mid-way |

### 3.6 Output
| Feature | Description |
|---------|-------------|
| Direct download | Single click download for processed image |
| Batch ZIP | ZIP file containing all processed images |
| Filename format | `{original}_bordered.{ext}` |
| Quality preservation | Maintain EXIF data where possible |

---

## 4. User Interface Design

### 4.1 Layout Structure

```
+----------------------------------------------------------+
|  [Logo] Framr              [Light/Dark Toggle] [?]  |
+----------------------------------------------------------+
|                                                          |
|  +----------------------------------------------------+  |
|  |                                                    |  |
|  |              DROP IMAGES HERE                      |  |
|  |                                                    |  |
|  |         [Or click to select files]                 |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+

After images loaded:

+----------------------------------------------------------+
|  [Logo] Framr              [Light/Dark Toggle] [?]  |
+----------------------------------------------------------+
|  Sidebar (280px)    |          Main Content              |
|  +--------------+   |   +----------------------------+   |
|  | IMAGES (3)   |   |   |                            |   |
|  | [Thumb1] x   |   |   |                            |   |
|  | [Thumb2] x   |   |   |      PREVIEW CANVAS        |   |
|  | [Thumb3] x   |   |   |                            |   |
|  |              |   |   |                            |   |
|  | [+ Add more] |   |   |                            |   |
|  +--------------+   |   +----------------------------+   |
|  |              |   |   [Before/After] [Fit] [100%]      |
|  | BORDER       |   |                                    |
|  | Width: [===] |   +------------------------------------+
|  | Color: [#]   |   |                                    |
|  |              |   |   QUICK PRESETS                    |
|  | [Advanced v] |   |   [White 3%] [White 5%] [Black 5%] |
|  +--------------+   |   [Black 10%] [Instagram]          |
|  |              |   |                                    |
|  | [Process All]|   +------------------------------------+
|  | [Download]   |   |                                    |
|  +--------------+   |   [Download All] [Download ZIP]    |
+----------------------------------------------------------+
```

### 4.2 Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Side-by-side: sidebar + preview |
| Tablet (768-1024px) | Stacked: preview on top, controls below |
| Mobile (<768px) | Full-width stacked, collapsible sections |

### 4.3 Theme System

Framr's chrome surrounds a photograph the user is colour-judging. The chrome is therefore
a neutral instrument: it stays cool-tinted and low-chroma so it does not shift the perceived
white balance of the image inside it. Blue remains the anchor hue for that reason, not as a
default.

**Anchor hue:** 250 (cool blue). Neutrals carry a trace of it (chroma 0.008-0.015) so no
surface is flat grey. Colours are expressed in OKLCH for perceptually even lightness steps.

**Light Mode:**
- Background: oklch(97% 0.006 250)
- Surface: oklch(99% 0.004 250)
- Text: oklch(20% 0.012 250)
- Accent: oklch(52% 0.19 250) (blue)
- Border: oklch(90% 0.008 250)

**Dark Mode:**
- Background: oklch(14.5% 0.010 250)
- Surface: oklch(21% 0.013 250)
- Text: oklch(94% 0.006 250)
- Accent: oklch(62% 0.16 250) (blue)
- Border: oklch(34% 0.014 250)

**Accent budget:** the accent occupies 3% or less of any viewport. It has exactly two jobs -
the focus ring, and the single primary action (Process). It is never used to mean "selected".

**Selection language:** an active preset, segment, swatch, or queue row reads through
surface *contrast*, an accent hairline, and font weight - never through an accent fill.
This keeps selection legible when several controls are active at once.

"Contrast" rather than "elevation" is deliberate. In dark mode the selected surface is
lighter than the surface beneath it; in light mode it is darker. Light mode has almost no
headroom above `--color-surface` (Y 0.971), so a genuinely lighter selected state would be
invisible. What has to hold in both themes is that the selected surface *separates* from its
neighbour, not that it separates in the same direction.

**Elevation:** dark mode raises surfaces by lightness, not by shadow. Shadows are invisible
against a dark background and read as glow when forced.

The steps are uneven on purpose, and sized by what each boundary has to do rather than by a
fixed increment. The containment pairs a user actually reads as separate regions - preview
stage against sidebar, page against header, panel against popover - carry roughly 6% L. The
steps near the top of the ladder are smaller (2% between hover, raised, and selected) because
they are bounded from above: muted metadata on a selected row must hold 4.5:1, and the accent
hairline on a selected surface must hold 3:1. `--color-surface-selected` sits at 29% rather
than 30% for that second reason - at 30% the hairline falls to 2.93:1 and stops clearing AA.

An earlier revision of this section specified "approximately +4% L per level". That produced
adjacent surfaces at 1.06:1, which is imperceptible, so the numbers were widened.

**On measuring dark elevation:** WCAG contrast ratios understate every dark pair, because the
+0.05 flare term in the formula saturates near black. A 3:1 ratio over a 14.5% L page needs
Y=0.109, i.e. L≈0.478 - a light grey, not a dark theme. Judge adjacent dark surfaces by OKLCH
ΔL, and reserve contrast ratios for the text and hairline minimums above, which are real
accessibility floors.

**Scope of the lightness bands:** the 12-18% dark / 96-98% light band describes the *base*
surface (`--color-background`). Surfaces above the base necessarily sit outside it -
`--color-surface` ships at 21% - or the ladder would have nowhere to go.

### 4.4 Typography

Framr ships no webfont for its own interface. Every byte on the critical render path competes
with the image the user came to work on, and the tool's pitch is that it starts instantly.
Character comes from the scale and from how the two voices are used, not from a licensed face.

**Two voices:**
- **Chrome** - system UI stack. Labels, headings, buttons, body copy, help text.
- **Data** - system monospace stack with `font-variant-numeric: tabular-nums`. Every value the
  user reads or compares: pixel dimensions, hex colours, percentages, file sizes, zoom level,
  keyboard hints, and the `<Framr />` wordmark.

The data voice is a functional choice before it is a stylistic one. Tabular figures let a column
of dimensions or a row of hex values align, which is what a photographer actually scans for.

**Font stacks:**
- Chrome: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
- Data: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

The data stack names only faces that ship with an operating system. An earlier stack led with
`JetBrains Mono`, which the project never loaded, so it silently fell through to Monaco or
Consolas. Do not name a face the project does not ship. (JetBrains Mono remains available as a
*text-overlay* font in `src/utils/fonts.ts` - that path loads on demand and is unrelated.)

**Scale** - six steps, replacing the previous two-size system:

| Token | Size | Use |
|-------|------|-----|
| `--text-micro` | 11px | Section micro-labels, badges |
| `--text-xs` | 12px | Helper text, secondary metadata |
| `--text-sm` | 14px | Control labels, body copy |
| `--text-base` | 16px | Section headings, drawer titles |
| `--text-lg` | 20px | Panel titles |
| `--text-xl` | 28px | Wordmark, empty-state headline |

**One heading voice.** Sidebar sections, accordion triggers, and preset group headings all use
the same treatment. The interface previously carried three competing heading styles on one
screen.

### 4.5 Motion

Framr has no brand motion personality. The governing profile is **platform-native neutral web
defaults**, chosen deliberately: the subject is the photograph, and the chrome is an instrument
that should not draw attention to itself. Motion earns its place by carrying information or it
is cut.

**Duration bands:**

| Role | Duration | Use |
|------|----------|-----|
| Fast feedback | 100-150ms | Button press, toggle, segment/chip/swatch select |
| Standard entrance | 200-300ms | Accordion, drawer, queue row, toast |
| Standard exit | 150-220ms | The same surfaces, at ~75% of the entrance |
| Continuous gesture | untimed | Sliders, compare drag, queue reorder |

Easing is the platform ease-out for entrances and ease-in for exits. `transition: all` is banned
- always enumerate the properties.

**What does not move:**
- **The preview canvas.** Settings changes drive a debounced re-render on every slider tick. The
  canvas container carries no transition; the new pixels are the feedback.
- **Direct manipulation.** Sliders and the compare handle track the pointer one-to-one with no
  timed transition.
- **Focus rings.** A focus ring is never inside a transition. It must be fully visible on the
  first frame after focus lands, or keyboard users have no indicator.

**Direct manipulation** uses Pointer Events throughout: a single active `pointerId`,
`setPointerCapture` after any DOM move, every event filtered by pointer identity, and both
`pointercancel` and `lostpointercapture` treated as cancellation with idempotent cleanup.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, all travel and scale are removed -
the drawer appears in place, the accordion opens instantly, rows and toasts appear without
sliding. Colour, opacity, focus indicators, and every selected or disabled state are retained.
Direct manipulation is *not* reduced: the slider and compare handle stay one-to-one with the
user's hand, and only autonomous post-release settling is removed. Progress bars keep running -
they are functional, not decorative.

**Success is silent.** A toast fires for failures and for async results the user cannot see.
It does not announce something the interface already shows.

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 18+ | Component-based, good ecosystem |
| Build tool | Vite | Fast builds, easy static deployment |
| Styling | Tailwind CSS | Utility-first, small bundle |
| Image processing | Canvas API | Native browser support |
| Heavy processing | Web Workers | Prevent UI blocking |
| ZIP generation | JSZip | Client-side ZIP creation |
| File download | FileSaver.js | Cross-browser downloads |

### 5.2 Project Structure

```
framr/
├── public/
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── components/
│   │   ├── App.tsx
│   │   ├── DropZone.tsx
│   │   ├── ImageQueue.tsx
│   │   ├── PreviewCanvas.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── PresetButtons.tsx
│   │   ├── DownloadPanel.tsx
│   │   └── ThemeToggle.tsx
│   ├── hooks/
│   │   ├── useImageProcessor.ts
│   │   ├── useDebounce.ts
│   │   └── useTheme.ts
│   ├── workers/
│   │   └── imageProcessor.worker.ts
│   ├── utils/
│   │   ├── imageUtils.ts
│   │   ├── colorUtils.ts
│   │   └── downloadUtils.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### 5.3 Core Data Types

```typescript
interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalWidth: number;
  originalHeight: number;
  thumbnailUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  processedBlob?: Blob;
  error?: string;
}

interface BorderSettings {
  width: number;
  widthUnit: 'px' | '%';
  color: string;
  aspectAware: boolean;
}

interface ResizeSettings {
  enabled: boolean;
  width?: number;
  height?: number;
  unit: 'px' | '%';
  maintainAspect: boolean;
}

interface OutputSettings {
  format: 'original' | 'jpeg' | 'png' | 'webp';
  quality: number; // 1-100 for JPEG/WebP
}

interface ProcessingConfig {
  border: BorderSettings;
  resize: ResizeSettings;
  output: OutputSettings;
}
```

### 5.4 Image Processing Pipeline

```
1. Load Image
   └─> FileReader.readAsArrayBuffer()
   └─> Create ImageBitmap (for large images)
   └─> Extract dimensions

2. Generate Preview (debounced, 300ms)
   └─> Scale down to preview size (max 1200px)
   └─> Apply border to scaled version
   └─> Display in preview canvas

3. Process for Export
   └─> Transfer to Web Worker
   └─> Create OffscreenCanvas at full resolution
   └─> Apply resize (if configured)
   └─> Calculate border dimensions
   └─> Draw image centered with border
   └─> Encode to target format
   └─> Transfer blob back to main thread

4. Download
   └─> Single: FileSaver.saveAs(blob, filename)
   └─> Batch: JSZip → add all blobs → generate → download
```

### 5.5 Memory Management for Large Images

For images approaching 100MP (~250MB):

```typescript
// Strategy for large image handling
async function processLargeImage(file: File): Promise<Blob> {
  // 1. Use createImageBitmap with resizeQuality
  const bitmap = await createImageBitmap(file, {
    resizeQuality: 'high'
  });

  // 2. Process in Web Worker to avoid blocking UI
  const worker = new Worker('./imageProcessor.worker.ts');

  // 3. Use OffscreenCanvas in worker for better memory handling
  const offscreen = new OffscreenCanvas(targetWidth, targetHeight);

  // 4. Explicitly release memory when done
  bitmap.close();

  return resultBlob;
}
```

**Memory warnings:**
- Display warning when estimated memory usage exceeds 500MB
- Suggest processing images in smaller batches
- Auto-pause batch processing if memory pressure detected

---

## 6. User Flows

### 6.1 Single Image Flow

```
User lands on page
    │
    ▼
Sees empty drop zone
    │
    ├─> Drags image onto page
    │   OR
    └─> Clicks "Select files"
    │
    ▼
Image loads, preview appears with default 5% white border
    │
    ▼
User adjusts settings (preview updates in real-time)
    │
    ├─> Clicks preset button → Settings apply
    │   OR
    └─> Manually adjusts slider/color
    │
    ▼
User clicks "Download"
    │
    ▼
Browser downloads processed image
```

### 6.2 Batch Processing Flow

```
User selects multiple images (10 files)
    │
    ▼
Sidebar shows queue with thumbnails
First image shows in preview
    │
    ▼
User configures settings
    │
    ▼
User clicks "Process All"
    │
    ▼
Progress bar shows 0/10
Images process sequentially (parallel in worker)
    │
    ▼
Progress updates: 1/10... 5/10... 10/10
    │
    ▼
"Download ZIP" button activates
User downloads framr-export.zip
```

---

## 7. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All controls focusable, logical tab order |
| Screen reader support | ARIA labels on all interactive elements |
| Color contrast | WCAG AA minimum (4.5:1 for text) |
| Reduced motion | Respect `prefers-reduced-motion` |
| Focus indicators | Visible focus rings on all controls |
| Alt text | Descriptive alt text for UI images |

---

## 8. Performance Targets

| Metric | Target |
|--------|--------|
| Initial load (FCP) | < 1.5s |
| Time to Interactive | < 2s |
| Preview update | < 300ms after input |
| Process 10MP image | < 2s |
| Process 50MP image | < 8s |
| Bundle size (gzipped) | < 100KB (excluding JSZip) |

---

## 9. Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 15+ | Full support |
| Edge | 90+ | Full support |
| Mobile Chrome | 90+ | Touch-optimized |
| Mobile Safari | 15+ | Touch-optimized |

**Required APIs:**
- Canvas 2D Context
- Web Workers
- File API
- Blob API
- OffscreenCanvas (graceful degradation if unavailable)

---

## 10. Deployment

### 10.1 Build Process

```bash
# Development
npm run dev        # Start Vite dev server

# Production build
npm run build      # Output to /dist
npm run preview    # Preview production build

# Deploy
npm run deploy     # Build + deploy to GitHub Pages
```

### 10.2 GitHub Pages Setup

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 10.3 Self-Hosted Setup

The built `/dist` folder is completely static and can be served by:
- Nginx
- Apache
- Caddy
- Any static file server

```nginx
# Example nginx config
server {
    listen 80;
    server_name framr.example.com;
    root /var/www/framr/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 11. Future Enhancements (Out of Scope for V1)

| Feature | Description | Complexity |
|---------|-------------|------------|
| Optional localStorage | Save presets between sessions | Low |
| Watermark overlay | Add logo/text watermark | Medium |
| Aspect ratio padding | Pad to specific ratios (4:5, 1:1) | Medium |
| Image filters | Basic adjustments (brightness, contrast) | Medium |
| Batch rename | Custom filename templates | Low |
| Share link | Generate shareable preview link | High |
| PWA support | Install as app, offline support | Medium |
| EXIF preservation | Maintain all metadata | Medium |

---

## 12. Development Phases

### Phase 1: Core MVP (Week 1-2)
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Drop zone component
- [ ] Single image preview
- [ ] Basic border controls (width slider, color picker)
- [ ] Canvas-based processing
- [ ] Single image download

### Phase 2: Polish & Presets (Week 3)
- [ ] Light/dark theme toggle
- [ ] Preset buttons
- [ ] Debounced live preview
- [ ] Before/after comparison
- [ ] Responsive layout

### Phase 3: Batch & Advanced (Week 4)
- [ ] Multi-image queue
- [ ] Web Worker processing
- [ ] Progress indicators
- [ ] ZIP download
- [ ] Advanced settings panel
- [ ] Resize functionality

### Phase 4: Testing & Launch (Week 5)
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation
- [ ] GitHub Pages deployment

---

## 13. Open Questions

1. ~~**Name confirmation:**~~ **Confirmed: "Framr"**
2. **Logo/branding:** Will you provide a logo, or should a simple text logo suffice for V1?
3. **Error handling:** How verbose should error messages be? (Technical vs. user-friendly)
4. **Analytics:** Any need for privacy-respecting analytics (e.g., Plausible)?

---

## 14. Appendix: Comparison with Desktop Version

| Feature | Desktop (BorderPy) | Web (Framr) |
|---------|-------------------|-------------------|
| Installation | Python + dependencies | None (browser) |
| Platform | Windows, macOS, Linux | Any modern browser |
| Processing | PIL/Pillow | Canvas API |
| Batch size | Unlimited | Memory-limited |
| Profiles | Saved to JSON file | Presets only (V1) |
| File management | Move/delete originals | Download only |
| Offline | Yes | No (unless PWA) |
| Performance | Native speed | Near-native (WebGL possible) |

---

*Document created: January 2026*
*Last updated: January 2026*
