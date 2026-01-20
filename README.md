# &lt;Framr /&gt;

A fast, privacy-focused web application for adding borders to images. Perfect for photographers preparing images for Instagram, print, or portfolio display.

**[Try it live](https://totally-tim.github.io/Framr/)**

## Features

- **Drag & Drop Upload** - Drop single or multiple images directly into the browser
- **Live Preview** - See border changes in real-time with debounced updates
- **Batch Processing** - Process multiple images at once with Web Workers for non-blocking performance
- **Quick Presets** - One-click presets for common border sizes (3%, 5%, 10% in white or black)
- **Customizable Borders** - Adjust width (px or %), pick any color, use aspect-aware borders
- **Resize Options** - Optional resize with aspect ratio maintenance
- **Multiple Export Formats** - Save as JPEG, PNG, WebP, or original format
- **ZIP Download** - Download all processed images as a single ZIP file
- **Dark/Light Theme** - Toggle between themes based on your preference
- **100% Client-Side** - All processing happens in your browser. No uploads, no server, complete privacy

## Usage

1. **Upload Images** - Drag and drop images onto the drop zone, or click to browse
2. **Adjust Settings** - Use presets for quick borders, or customize width and color
3. **Preview** - Toggle "Before/After" to compare, zoom and pan to inspect details
4. **Process** - Click "Process All" to apply borders to all images
5. **Download** - Download individual images or all as a ZIP

## Supported Formats

- JPEG / JPG
- PNG
- WebP
- TIFF

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/totally-tim/Framr.git
cd Framr

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Lint

```bash
npm run lint
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Canvas API** - Image processing
- **Web Workers** - Non-blocking batch processing
- **JSZip** - Client-side ZIP creation
- **FileSaver.js** - File downloads

## Project Structure

```
src/
├── components/       # React components
│   ├── App.tsx           # Main application
│   ├── ControlPanel.tsx  # Border/resize settings
│   ├── DownloadPanel.tsx # Process and download controls
│   ├── DropZone.tsx      # File upload area
│   ├── ImageQueue.tsx    # Image list sidebar
│   ├── PresetButtons.tsx # Quick preset buttons
│   ├── PreviewCanvas.tsx # Live preview with zoom/pan
│   └── ThemeToggle.tsx   # Dark/light mode toggle
├── hooks/            # Custom React hooks
│   ├── useDebounce.ts
│   ├── useImageProcessor.ts
│   └── useTheme.ts
├── utils/            # Utility functions
│   ├── colorUtils.ts
│   ├── downloadUtils.ts
│   └── imageUtils.ts
├── workers/          # Web Workers
│   └── imageProcessor.worker.ts
├── types/            # TypeScript types
│   └── index.ts
└── styles/           # Global styles
    └── globals.css
```

## Privacy

Framr processes all images entirely in your browser. Your images are never uploaded to any server. When you close the tab, all data is gone.

## License

MIT

---

Built with React + TypeScript + Vite
