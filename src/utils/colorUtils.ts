export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * The '#' is optional. Someone typing a hex into the border or text-colour
 * field types the six digits they read off a palette, and requiring the hash
 * meant "112233" was rejected on every keystroke and silently reverted on blur.
 * `hexToRgb` above has always accepted a bare value, and `normalizeHex` puts
 * the '#' back, so this was the one place that disagreed.
 */
export function isValidHex(color: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * What may be committed *while the field is still being typed into*.
 *
 * Shorthand is deliberately excluded. A three-digit value is ambiguous mid-word:
 * "112" is a complete shorthand and equally the first half of "112233", and the
 * colour fields normalize whatever they accept and sync it back into the
 * controlled input. Honouring shorthand on every keystroke therefore rewrote
 * the field to "#111122" on the third character and the remaining digits landed
 * on the end of that, so the six-digit value could never be typed - the exact
 * entry making the '#' optional was meant to allow. Six digits is the only
 * length that cannot be a prefix of something longer, so it is the only length
 * that commits live; `isValidHex` still admits shorthand on blur, where the
 * value is final and the ambiguity is gone.
 */
export function isCompleteHex(color: string): boolean {
  return /^#?[A-Fa-f0-9]{6}$/.test(color);
}

/** Always returns `#RRGGBB`: shorthand expanded, '#' added, digits upper-cased. */
export function normalizeHex(color: string): string {
  let hex = color.replace('#', '');

  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  return '#' + hex.toUpperCase();
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export const PRESET_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Charcoal', value: '#1A1A1A' },
  { name: 'Dark Gray', value: '#333333' },
  { name: 'Light Gray', value: '#F5F5F5' },
  { name: 'Cool White', value: '#F0F8FF' },
  { name: 'Warm White', value: '#FFFEF0' },
  { name: 'Ivory', value: '#FFFFF0' },
  { name: 'White', value: '#FFFFFF' },
];

/**
 * Text-overlay colours, chosen to sit *on a photograph*.
 *
 * These were previously Tailwind's stock 500 ramp, which is tuned for legibility
 * on a flat UI surface: high chroma at mid lightness, evenly spaced around the
 * wheel. Over a photograph that ramp reads as a sticker, because nothing in a
 * photograph is that saturated at that lightness.
 *
 * The set below spreads lightness instead of hue, since lightness contrast is
 * what makes a caption legible against an unpredictable image: two near-white
 * papers, three darks, three mid-chroma inks borrowed from photographic
 * practice - the darkroom safelight, the cyan process primary, and sepia
 * toning. Every value is off-neutral on purpose; pure #FFFFFF and #000000 clip
 * against a photograph's own highlights and shadows and lose their edge.
 */
export const TEXT_COLOR_PRESETS = [
  { name: 'Paper White', value: '#F7F4EE' },
  { name: 'Rich Black', value: '#0C0C0E' },
  { name: 'Bone', value: '#E2D9C8' },
  { name: 'Signal Red', value: '#C8102E' },
  { name: 'Safelight Amber', value: '#E0912F' },
  { name: 'Cyan', value: '#0F9BB8' },
  { name: 'Deep Indigo', value: '#2B2D63' },
  { name: 'Sepia', value: '#6B4A2C' },
];

export const CANVAS_BACKGROUND_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#333333' },
  { name: 'Medium Gray', value: '#808080' },
  { name: 'Light Gray', value: '#C0C0C0' },
  { name: 'Off White', value: '#F5F5F5' },
  { name: 'White', value: '#FFFFFF' },
];
