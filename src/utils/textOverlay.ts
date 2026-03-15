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

  const pos = settings.position;
  const isMiddleRow = pos.startsWith('middle');

  // Determine the reference border for font sizing based on position row.
  // For top/bottom rows, use that row's border. For middle, use the smaller canvas dimension.
  let refBorder: number;
  if (isMiddleRow) {
    // On-image text: base size on ~5% of image area height
    const imageHeight = canvasHeight - (border.top + border.bottom) * scale;
    refBorder = Math.max(imageHeight * 0.12, 12);
  } else if (pos.startsWith('top')) {
    refBorder = border.top > 0 ? border.top : Math.max(border.bottom, border.left, border.right);
  } else {
    refBorder = border.bottom > 0 ? border.bottom : Math.max(border.top, border.left, border.right);
  }

  const basePx = Math.max(12, Math.round(refBorder * 0.4));
  // Cap font size at 6% of canvas height to prevent overflow with huge borders
  const maxFontSize = Math.round(canvasHeight * 0.06);
  const fontSize = Math.min(Math.round(basePx * settings.fontSize * scale), maxFontSize);
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

  // --- X position ---
  let textX: number;
  if (pos.endsWith('center')) {
    ctx.textAlign = 'center';
    textX = canvasWidth / 2;
  } else if (pos.endsWith('left')) {
    ctx.textAlign = 'left';
    // Use actual left border, fall back to padding if border is zero
    const leftEdge = border.left > 0 ? border.left * scale : 0;
    textX = leftEdge + padding;
  } else {
    ctx.textAlign = 'right';
    const rightEdge = border.right > 0 ? border.right * scale : 0;
    textX = canvasWidth - rightEdge - padding;
  }

  // --- Y position ---
  let textY: number;
  if (isMiddleRow) {
    // Center of the image area (between top and bottom borders)
    const imageTop = border.top * scale;
    const imageBottom = canvasHeight - border.bottom * scale;
    textY = (imageTop + imageBottom) / 2;
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
