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

**Light Mode:**
- Background: #FAFAFA
- Surface: #FFFFFF
- Text: #1A1A1A
- Accent: #2563EB (blue)
- Border: #E5E7EB

**Dark Mode:**
- Background: #0F0F0F
- Surface: #1A1A1A
- Text: #F5F5F5
- Accent: #3B82F6 (blue)
- Border: #2D2D2D

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
