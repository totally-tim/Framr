import type { TextOverlaySettings } from '../types';
import { getContrastColor } from './colorUtils';

interface BorderSizes {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Draw a text overlay onto a canvas context positioned within the border area.
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

  ctx.save();
  ctx.globalAlpha = settings.opacity;
  ctx.font = `${fontSize}px ${settings.fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  const pos = settings.position;

  // --- X position ---
  let textX: number;
  if (pos === 'bottom-center' || pos === 'top-center') {
    ctx.textAlign = 'center';
    textX = canvasWidth / 2;
  } else if (pos === 'bottom-left' || pos === 'top-left') {
    ctx.textAlign = 'left';
    textX = border.left * scale + padding;
  } else {
    // bottom-right
    ctx.textAlign = 'right';
    textX = canvasWidth - border.right * scale - padding;
  }

  // --- Y position ---
  let textY: number;
  if (pos.startsWith('top')) {
    const topPx = border.top * scale;
    textY = topPx > fontSize ? topPx / 2 : fontSize / 2 + padding;
  } else {
    const botPx = border.bottom * scale;
    textY = botPx > fontSize
      ? canvasHeight - botPx / 2
      : canvasHeight - fontSize / 2 - padding;
  }

  ctx.fillText(settings.text, textX, textY);
  ctx.restore();
}
