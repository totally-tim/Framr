import type { BorderSettings, GradientStop } from '../types';

/**
 * Creates and applies a gradient fill (or solid fill) to the given canvas context
 * covering the full canvas area.
 */
export function applyBorderFill(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  settings: BorderSettings,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (settings.borderMode === 'solid') {
    ctx.fillStyle = settings.color;
  } else if (settings.borderMode === 'linear-gradient') {
    ctx.fillStyle = createLinearGradient(ctx, settings.gradientStops, settings.gradientAngle, canvasWidth, canvasHeight);
  } else {
    ctx.fillStyle = createRadialGradient(ctx, settings.gradientStops, canvasWidth, canvasHeight);
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function createLinearGradient(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  stops: GradientStop[],
  angleDeg: number,
  width: number,
  height: number
): CanvasGradient {
  const angleRad = (angleDeg * Math.PI) / 180;
  // Compute start/end points so gradient spans the full canvas diagonal
  const cx = width / 2;
  const cy = height / 2;
  const len = Math.abs(width * Math.cos(angleRad)) + Math.abs(height * Math.sin(angleRad));
  const half = len / 2;
  const x0 = cx - Math.cos(angleRad) * half;
  const y0 = cy - Math.sin(angleRad) * half;
  const x1 = cx + Math.cos(angleRad) * half;
  const y1 = cy + Math.sin(angleRad) * half;

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  applyStops(gradient, stops);
  return gradient;
}

function createRadialGradient(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  stops: GradientStop[],
  width: number,
  height: number
): CanvasGradient {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(width, height) / 2;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  applyStops(gradient, stops);
  return gradient;
}

function applyStops(gradient: CanvasGradient, stops: GradientStop[]): void {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  for (const stop of sorted) {
    gradient.addColorStop(stop.position / 100, stop.color);
  }
}

/** Returns a CSS gradient string for display purposes (e.g. preview swatches). */
export function gradientToCss(settings: BorderSettings): string {
  if (settings.borderMode === 'solid') return settings.color;

  const stops = [...settings.gradientStops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ');

  if (settings.borderMode === 'linear-gradient') {
    return `linear-gradient(${settings.gradientAngle}deg, ${stops})`;
  }
  return `radial-gradient(circle, ${stops})`;
}

export const GRADIENT_PRESETS: { id: string; name: string; stops: GradientStop[]; angle: number; mode: 'linear-gradient' | 'radial-gradient' }[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    stops: [{ id: 'sunset-0', color: '#FF6B6B', position: 0 }, { id: 'sunset-1', color: '#FFE66D', position: 100 }],
    angle: 135,
    mode: 'linear-gradient',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    stops: [{ id: 'ocean-0', color: '#2193B0', position: 0 }, { id: 'ocean-1', color: '#6DD5ED', position: 100 }],
    angle: 135,
    mode: 'linear-gradient',
  },
  {
    id: 'neon',
    name: 'Neon',
    stops: [{ id: 'neon-0', color: '#A855F7', position: 0 }, { id: 'neon-1', color: '#06B6D4', position: 100 }],
    angle: 90,
    mode: 'linear-gradient',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    stops: [{ id: 'pastel-0', color: '#FBCFE8', position: 0 }, { id: 'pastel-1', color: '#BAE6FD', position: 100 }],
    angle: 45,
    mode: 'linear-gradient',
  },
  {
    id: 'forest',
    name: 'Forest',
    stops: [{ id: 'forest-0', color: '#134E5E', position: 0 }, { id: 'forest-1', color: '#71B280', position: 100 }],
    angle: 135,
    mode: 'linear-gradient',
  },
  {
    id: 'radial-glow',
    name: 'Glow',
    stops: [{ id: 'glow-0', color: '#FFFFFF', position: 0 }, { id: 'glow-1', color: '#6B7280', position: 100 }],
    angle: 0,
    mode: 'radial-gradient',
  },
];
