import type { TextOverlaySettings } from '../types';
import { getContrastColor } from './colorUtils';

interface BorderSizes {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Draw a text overlay onto a canvas context.
 * Supports 9 positions (3x3 grid), font weight, and text shadow.
 * Works with both CanvasRenderingContext2D (preview) and
 * OffscreenCanvasRenderingContext2D (worker).
 */
export function drawTextOverlay(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  border: BorderSizes,
  borderColor: string,
  settings: TextOverlaySettings,
  scale = 1,
): void {
  if (!settings.enabled || !settings.text.trim()) return;

  // Base font size: 40% of the largest vertical border, minimum 12px (unscaled).
  const vertBorder = Math.max(border.top, border.bottom);
  const horizBorder = Math.max(border.left, border.right);
  const refBorder = vertBorder > 0 ? vertBorder : horizBorder;
  const basePx = Math.max(12, Math.round(refBorder * 0.4));
  const fontSize = Math.round(basePx * settings.fontSize * scale);
  const padding = Math.max(Math.round(8 * scale), Math.round(fontSize * 0.3));

  const color = settings.useAutoColor ? getContrastColor(borderColor) : settings.color;

  const fontFamily = settings.fontFamily.includes(' ')
    ? `"${settings.fontFamily}"`
    : settings.fontFamily;
  const fontWeight = settings.fontWeight || 400;

  ctx.save();
  ctx.globalAlpha = settings.opacity;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  const pos = settings.position;
  const isMiddleRow = pos.startsWith('middle');

  // --- X position ---
  let textX: number;
  if (pos.endsWith('center')) {
    ctx.textAlign = 'center';
    textX = canvasWidth / 2;
  } else if (pos.endsWith('left')) {
    ctx.textAlign = 'left';
    textX = border.left * scale + padding;
  } else {
    ctx.textAlign = 'right';
    textX = canvasWidth - border.right * scale - padding;
  }

  // --- Y position ---
  let textY: number;
  if (isMiddleRow) {
    textY = canvasHeight / 2;
  } else if (pos.startsWith('top')) {
    const topPx = border.top * scale;
    textY = topPx > fontSize ? topPx / 2 : fontSize / 2 + padding;
  } else {
    const botPx = border.bottom * scale;
    textY = botPx > fontSize
      ? canvasHeight - botPx / 2
      : canvasHeight - fontSize / 2 - padding;
  }

  // --- Text shadow ---
  if (settings.textShadow?.enabled) {
    const shadow = settings.textShadow;
    ctx.shadowColor = shadow.useAutoColor
      ? getContrastColor(color)
      : shadow.color;
    ctx.shadowBlur = shadow.blur * scale;
    ctx.shadowOffsetX = shadow.offsetX * scale;
    ctx.shadowOffsetY = shadow.offsetY * scale;
  }

  ctx.fillText(settings.text, textX, textY);
  ctx.restore();
}
