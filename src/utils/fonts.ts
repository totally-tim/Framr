import type { FontMeta, TextOverlaySettings } from '../types';

const GOOGLE_FONTS_CDN = 'https://fonts.gstatic.com/s';

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
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.woff2` },
      { weight: 900, label: 'Black', url: `${GOOGLE_FONTS_CDN}/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.woff2` },
    ],
  },
  {
    name: 'Bungee',
    family: 'Bungee',
    category: 'display',
    featured: true,
    tags: ['bold', 'blocky'],
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/bungee/v14/N0bU2SZBIuF2PU_0AnA.woff2` },
    ],
  },
  {
    name: 'Black Ops One',
    family: 'Black Ops One',
    category: 'display',
    tags: ['military', 'stencil'],
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/blackopsone/v20/qWcsB6-ypo7xBdr6Xshe96H3aDvS.woff2` },
    ],
  },
  {
    name: 'Righteous',
    family: 'Righteous',
    category: 'display',
    tags: ['retro', 'rounded'],
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/righteous/v17/1cXxaUPXBpj2rGoU7C9WiHGF.woff2` },
    ],
  },
  {
    name: 'Russo One',
    family: 'Russo One',
    category: 'display',
    tags: ['industrial', 'bold'],
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/russoone/v16/Z9XUDmZRWg6M1LvRYsHOz8mJ.woff2` },
    ],
  },
  {
    name: 'Chakra Petch',
    family: 'Chakra Petch',
    category: 'display',
    tags: ['tech', 'angular'],
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/chakrapetch/v11/cIflMapbsEk7TDLdtEz1BwkWn6BPig.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/chakrapetch/v11/cIf6MapbsEk7TDLdtEz1BwkmmKBh.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/chakrapetch/v11/cIflMapbsEk7TDLdtEz1BwkWi6dPig.woff2` },
    ],
  },

  // --- Sans-serif ---
  {
    name: 'Inter',
    family: 'Inter',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/inter/v18/UcCo3FwrK3iLTcviYwY.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/inter/v18/UcCo3FwrK3iLTcviYwY.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/inter/v18/UcCo3FwrK3iLTcviYwY.woff2` },
    ],
  },
  {
    name: 'Roboto',
    family: 'Roboto',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/roboto/v47/KFOMCnqEu92Fr1ME7kSn.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/roboto/v47/KFOMCnqEu92Fr1ME7kSn.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/roboto/v47/KFOMCnqEu92Fr1ME7kSn.woff2` },
    ],
  },
  {
    name: 'Open Sans',
    family: 'Open Sans',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4g.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4g.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4g.woff2` },
    ],
  },
  {
    name: 'Lato',
    family: 'Lato',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/lato/v24/S6u9w4BMUTPHh7USSwiPGQ.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/lato/v24/S6uyw4BMUTPHjx4wXg.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2` },
    ],
  },
  {
    name: 'Montserrat',
    family: 'Montserrat',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff2` },
    ],
  },
  {
    name: 'Poppins',
    family: 'Poppins',
    category: 'sans-serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/poppins/v22/pxiByp8kv8JHgFVrLDz8Z1xlEA.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/poppins/v22/pxiEyp8kv8JHgFVrJJfecg.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/poppins/v22/pxiByp8kv8JHgFVrLCz7Z1xlEA.woff2` },
    ],
  },

  // --- Serif ---
  {
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'serif',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2` },
      { weight: 900, label: 'Black', url: `${GOOGLE_FONTS_CDN}/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2` },
    ],
  },
  {
    name: 'Merriweather',
    family: 'Merriweather',
    category: 'serif',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/merriweather/v30/u-4n0qyriQwlOrhSvowK_l521wRpX837pvjxPA.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/merriweather/v30/u-4n0qyriQwlOrhSvowK_l521wRpX837pvjxPA.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/merriweather/v30/u-4n0qyriQwlOrhSvowK_l521wRpX837pvjxPA.woff2` },
    ],
  },
  {
    name: 'Lora',
    family: 'Lora',
    category: 'serif',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuyJGmKxemMeZ.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuyJGmKxemMeZ.woff2` },
    ],
  },
  {
    name: 'Crimson Text',
    family: 'Crimson Text',
    category: 'serif',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJfbwhT.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJXsCx2C9lR.woff2` },
    ],
  },

  // --- Monospace ---
  {
    name: 'JetBrains Mono',
    family: 'JetBrains Mono',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2` },
    ],
  },
  {
    name: 'Fira Code',
    family: 'Fira Code',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/firacode/v22/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7MOzlojwUKQ.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/firacode/v22/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7MOzlojwUKQ.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/firacode/v22/uU9eCBsR6Z2vfE9aq3bL0fxyUs4tcw4W_D1sJVD7MOzlojwUKQ.woff2` },
    ],
  },
  {
    name: 'Source Code Pro',
    family: 'Source Code Pro',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/sourcecodepro/v23/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DMyQtMdrTlA.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/sourcecodepro/v23/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DMyQtMdrTlA.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/sourcecodepro/v23/HI_diYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DMyQtMdrTlA.woff2` },
    ],
  },
  {
    name: 'IBM Plex Mono',
    family: 'IBM Plex Mono',
    category: 'monospace',
    weights: [
      { weight: 300, label: 'Light', url: `${GOOGLE_FONTS_CDN}/ibmplexmono/v19/-F6pfjptAgt5VM-kVkqdyU8n3kwq0n1hj-sNFQ.woff2` },
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n5igg1l9kne.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/ibmplexmono/v19/-F6pfjptAgt5VM-kVkqdyU8n3oQu0n1hj-sNFQ.woff2` },
    ],
  },
  {
    name: 'Share Tech Mono',
    family: 'Share Tech Mono',
    category: 'monospace',
    tags: ['tech', 'digital'],
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQztYldFcLowEF.woff2` },
    ],
  },
  {
    name: 'VT323',
    family: 'VT323',
    category: 'monospace',
    tags: ['pixel', 'retro', 'terminal'],
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/vt323/v17/pxiKyp0ihIEF2isRFJXGdg.woff2` },
    ],
  },

  // --- Handwriting ---
  {
    name: 'Dancing Script',
    family: 'Dancing Script',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsniCgR7ot4g.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsniCgR7ot4g.woff2` },
    ],
  },
  {
    name: 'Pacifico',
    family: 'Pacifico',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/pacifico/v22/FwZY7-Qmy14u9lezJ-6H6Mk.woff2` },
    ],
  },
  {
    name: 'Caveat',
    family: 'Caveat',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9eIGpYCxF.woff2` },
      { weight: 700, label: 'Bold', url: `${GOOGLE_FONTS_CDN}/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9eIGpYCxF.woff2` },
    ],
  },
  {
    name: 'Satisfy',
    family: 'Satisfy',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/satisfy/v21/rP2Hp2yn6lkG50LoOZSCHBeH.woff2` },
    ],
  },
  {
    name: 'Great Vibes',
    family: 'Great Vibes',
    category: 'handwriting',
    weights: [
      { weight: 400, label: 'Regular', url: `${GOOGLE_FONTS_CDN}/greatvibes/v19/RWmMoKWR9v4ksMfaWd_JN9XFiaQ.woff2` },
    ],
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

export function isGenericFont(family: string): boolean {
  return GENERIC_FAMILY_NAMES.has(family);
}

export function getFontMeta(fontName: string): FontMeta | undefined {
  return ALL_FONTS.find((f) => f.name === fontName || f.family === fontName);
}

export function getFontUrl(fontName: string, weight: number): string | null {
  const meta = getFontMeta(fontName);
  if (!meta) return null;

  const exact = meta.weights.find((w) => w.weight === weight);
  if (exact?.url) return exact.url;

  // Fall back to closest available weight
  const sorted = [...meta.weights].sort(
    (a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight),
  );
  return sorted[0]?.url || null;
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
