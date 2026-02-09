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

export function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

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

export const CANVAS_BACKGROUND_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#333333' },
  { name: 'Medium Gray', value: '#808080' },
  { name: 'Light Gray', value: '#C0C0C0' },
  { name: 'Off White', value: '#F5F5F5' },
  { name: 'White', value: '#FFFFFF' },
];
