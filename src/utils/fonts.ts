import type { FontMeta, TextOverlaySettings } from '../types';

export const CURATED_FONTS: FontMeta[] = [
  // --- Display (featured) ---
  {
    name: 'DSEG7 Classic',
    family: 'DSEG7 Classic',
    category: 'display',
    featured: true,
    bundled: true,
    tags: ['seven-segment', 'digital', 'retro'],
    weights: [
      { weight: 400, label: 'Regular', url: '/fonts/DSEG7Classic-Regular.woff2' },
      { weight: 700, label: 'Bold', url: '/fonts/DSEG7Classic-Bold.woff2' },
    ],
  },
  {
    name: 'Orbitron',
    family: 'Orbitron',
    category: 'display',
    featured: true,
    tags: ['futuristic', 'geometric'],
    weights: [
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
      { weight: 900, label: 'Black', url: '' },
    ],
  },
  {
    name: 'Bungee',
    family: 'Bungee',
    category: 'display',
    featured: true,
    tags: ['bold', 'blocky'],
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'Black Ops One',
    family: 'Black Ops One',
    category: 'display',
    tags: ['military', 'stencil'],
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'Righteous',
    family: 'Righteous',
    category: 'display',
    tags: ['retro', 'rounded'],
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'Russo One',
    family: 'Russo One',
    category: 'display',
    tags: ['industrial', 'bold'],
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'Chakra Petch',
    family: 'Chakra Petch',
    category: 'display',
    tags: ['tech', 'angular'],
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },

  // --- Sans-serif ---
  {
    name: 'Inter',
    family: 'Inter',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Roboto',
    family: 'Roboto',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Open Sans',
    family: 'Open Sans',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Lato',
    family: 'Lato',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Montserrat',
    family: 'Montserrat',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Poppins',
    family: 'Poppins',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },

  // --- Serif ---
  {
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'serif',
    weights: [
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
      { weight: 900, label: 'Black', url: '' },
    ],
  },
  {
    name: 'Merriweather',
    family: 'Merriweather',
    category: 'serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Lora',
    family: 'Lora',
    category: 'serif',
    weights: [
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Crimson Text',
    family: 'Crimson Text',
    category: 'serif',
    weights: [
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },

  // --- Monospace ---
  {
    name: 'JetBrains Mono',
    family: 'JetBrains Mono',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Fira Code',
    family: 'Fira Code',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Source Code Pro',
    family: 'Source Code Pro',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'IBM Plex Mono',
    family: 'IBM Plex Mono',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Share Tech Mono',
    family: 'Share Tech Mono',
    category: 'monospace',
    tags: ['tech', 'digital'],
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'VT323',
    family: 'VT323',
    category: 'monospace',
    tags: ['pixel', 'retro', 'terminal'],
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },

  // --- Handwriting ---
  {
    name: 'Dancing Script',
    family: 'Dancing Script',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Pacifico',
    family: 'Pacifico',
    category: 'handwriting',
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'Caveat',
    family: 'Caveat',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Satisfy',
    family: 'Satisfy',
    category: 'handwriting',
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
  {
    name: 'Great Vibes',
    family: 'Great Vibes',
    category: 'handwriting',
    weights: [{ weight: 400, label: 'Regular', url: '' }],
  },
];

export const GENERIC_FONTS: FontMeta[] = [
  {
    name: 'Sans-serif',
    family: 'sans-serif',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Serif',
    family: 'serif',
    category: 'serif',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
  {
    name: 'Monospace',
    family: 'monospace',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: '' },
      { weight: 400, label: 'Regular', url: '' },
      { weight: 700, label: 'Bold', url: '' },
    ],
  },
];

export const ALL_FONTS: FontMeta[] = [...CURATED_FONTS, ...GENERIC_FONTS];

const GENERIC_FAMILY_NAMES = new Set(['sans-serif', 'serif', 'monospace']);
const RECENT_FONTS_KEY = 'framr-recent-fonts';
const MAX_RECENT = 5;

// Cache for resolved Google Fonts woff2 URLs
const googleFontUrlCache = new Map<string, string>();

export function isGenericFont(family: string): boolean {
  return GENERIC_FAMILY_NAMES.has(family);
}

export function getFontMeta(fontName: string): FontMeta | undefined {
  return ALL_FONTS.find((f) => f.name === fontName || f.family === fontName);
}

/**
 * Get a static/bundled font URL (sync). Returns null for Google Fonts — use loadFont() instead.
 */
export function getFontUrl(fontName: string, weight: number): string | null {
  const meta = getFontMeta(fontName);
  if (!meta) return null;

  const exact = meta.weights.find((w) => w.weight === weight);
  if (exact?.url) return exact.url;

  const sorted = [...meta.weights].sort(
    (a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight),
  );
  return sorted[0]?.url || null;
}

/**
 * Resolve a Google Fonts woff2 URL by fetching the CSS2 API.
 * Caches results so each family+weight is fetched only once.
 */
async function resolveGoogleFontUrl(family: string, weight: number): Promise<string | null> {
  const cacheKey = `${family}:${weight}`;
  const cached = googleFontUrlCache.get(cacheKey);
  if (cached) return cached;

  try {
    const apiUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const response = await fetch(apiUrl);
    if (!response.ok) return null;
    const css = await response.text();
    // Extract woff2 URL from the @font-face CSS
    const match = css.match(/url\(([^)]+\.woff2[^)]*)\)/);
    if (match) {
      const url = match[1];
      googleFontUrlCache.set(cacheKey, url);
      return url;
    }
  } catch {
    // Network error — font will fall back to generic
  }
  return null;
}

export async function loadFontInto(
  fonts: FontFaceSet,
  name: string,
  url: string,
  weight = 400,
): Promise<boolean> {
  // Already loaded?
  try {
    if (fonts.check(`${weight} 16px "${name}"`)) return true;
  } catch {
    // fonts.check can throw if font string is invalid; continue to load
  }

  try {
    const face = new FontFace(name, `url(${url})`, {
      weight: String(weight),
    });

    fonts.add(face);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await Promise.race([
        face.load(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new Error('Font load timeout')),
          );
        }),
      ]);
      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.warn(`Failed to load font "${name}" (${weight}):`, err);
    return false;
  }
}

/**
 * High-level font loader. Resolves the correct URL (bundled or Google Fonts API)
 * and loads the font into the given FontFaceSet. Works in both main thread and workers.
 */
export async function loadFont(
  fonts: FontFaceSet,
  fontName: string,
  weight = 400,
): Promise<boolean> {
  if (isGenericFont(fontName)) return true;

  const meta = getFontMeta(fontName);
  if (!meta) return false;

  // Bundled font — use static URL
  if (meta.bundled) {
    const url = getFontUrl(fontName, weight);
    if (url) return loadFontInto(fonts, meta.family, url, weight);
    return false;
  }

  // Google Font — resolve woff2 URL dynamically
  const url = await resolveGoogleFontUrl(meta.family, weight);
  if (url) return loadFontInto(fonts, meta.family, url, weight);
  return false;
}

export function isFontLoaded(name: string, weight = 400): boolean {
  try {
    return document.fonts.check(`${weight} 16px "${name}"`);
  } catch {
    return false;
  }
}

export function getRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_FONTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentFont(name: string): void {
  try {
    const recent = getRecentFonts().filter((f) => f !== name);
    recent.unshift(name);
    localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage might be unavailable
  }
}

export const FONT_CATEGORIES = [
  { value: 'all' as const, label: 'All' },
  { value: 'display' as const, label: 'Display' },
  { value: 'sans-serif' as const, label: 'Sans' },
  { value: 'serif' as const, label: 'Serif' },
  { value: 'monospace' as const, label: 'Mono' },
  { value: 'handwriting' as const, label: 'Hand' },
];

export type FontCategory = (typeof FONT_CATEGORIES)[number]['value'];

export const FILM_CAMERA_PRESET: Partial<TextOverlaySettings> = {
  fontFamily: 'DSEG7 Classic',
  fontWeight: 400,
  color: '#FF6600',
  position: 'bottom-right',
  fontSize: 0.7,
  useAutoColor: false,
  textShadow: { enabled: true, color: '#000000', useAutoColor: true, blur: 2, offsetX: 0, offsetY: 0 },
};
