import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawTextOverlay } from '../textOverlay';
import type { TextOverlaySettings } from '../../types';

interface MockCtx {
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  globalAlpha: number;
  font: string;
  fillStyle: string;
  textBaseline: string;
  textAlign: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

function createMockCtx(): MockCtx {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    globalAlpha: 1,
    font: '',
    fillStyle: '',
    textBaseline: '',
    textAlign: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };
}

function createSettings(overrides: Partial<TextOverlaySettings> = {}): TextOverlaySettings {
  return {
    enabled: true,
    text: 'Test',
    position: 'bottom-center',
    fontSize: 1.0,
    fontFamily: 'sans-serif',
    fontWeight: 400,
    color: '#000000',
    useAutoColor: false,
    opacity: 1.0,
    dateStampFormat: 'japanese',
    textShadow: {
      enabled: false,
      color: '#000000',
      useAutoColor: true,
      blur: 3,
      offsetX: 1,
      offsetY: 1,
    },
    textEffect: 'none',
    effectIntensity: 0.5,
    ...overrides,
  };
}

const border = { top: 100, right: 100, bottom: 100, left: 100 };
const canvasWidth = 1200;
const canvasHeight = 1000;

describe('drawTextOverlay', () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it('does not draw when disabled', () => {
    drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ enabled: false }));
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('does not draw when text is empty', () => {
    drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ text: '  ' }));
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  describe('9 positions', () => {
    it('bottom-center: centered X, near bottom Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'bottom-center' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBe(canvasWidth / 2);
      expect(y).toBeGreaterThan(canvasHeight / 2);
      expect(ctx.textAlign).toBe('center');
    });

    it('top-center: centered X, near top Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'top-center' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBe(canvasWidth / 2);
      expect(y).toBeLessThan(canvasHeight / 2);
      expect(ctx.textAlign).toBe('center');
    });

    it('top-left: left X, near top Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'top-left' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBeLessThan(canvasWidth / 2);
      expect(y).toBeLessThan(canvasHeight / 2);
      expect(ctx.textAlign).toBe('left');
    });

    it('top-right: right X, near top Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'top-right' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBeGreaterThan(canvasWidth / 2);
      expect(y).toBeLessThan(canvasHeight / 2);
      expect(ctx.textAlign).toBe('right');
    });

    it('bottom-left: left X, near bottom Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'bottom-left' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBeLessThan(canvasWidth / 2);
      expect(y).toBeGreaterThan(canvasHeight / 2);
      expect(ctx.textAlign).toBe('left');
    });

    it('bottom-right: right X, near bottom Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'bottom-right' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBeGreaterThan(canvasWidth / 2);
      expect(y).toBeGreaterThan(canvasHeight / 2);
      expect(ctx.textAlign).toBe('right');
    });

    it('middle-center: centered X, centered Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'middle-center' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBe(canvasWidth / 2);
      expect(y).toBe(canvasHeight / 2);
      expect(ctx.textAlign).toBe('center');
    });

    it('middle-left: left X, centered Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'middle-left' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBeLessThan(canvasWidth / 2);
      expect(y).toBe(canvasHeight / 2);
      expect(ctx.textAlign).toBe('left');
    });

    it('middle-right: right X, centered Y', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({ position: 'middle-right' }));
      const [, x, y] = ctx.fillText.mock.calls[0];
      expect(x).toBeGreaterThan(canvasWidth / 2);
      expect(y).toBe(canvasHeight / 2);
      expect(ctx.textAlign).toBe('right');
    });
  });

  describe('text shadow', () => {
    it('applies shadow properties when enabled', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({
        textShadow: { enabled: true, color: '#FF0000', useAutoColor: false, blur: 5, offsetX: 2, offsetY: 3 },
      }));
      expect(ctx.shadowColor).toBe('#FF0000');
      expect(ctx.shadowBlur).toBe(5);
      expect(ctx.shadowOffsetX).toBe(2);
      expect(ctx.shadowOffsetY).toBe(3);
    });

    it('does not set shadow when disabled', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({
        textShadow: { enabled: false, color: '#FF0000', useAutoColor: false, blur: 5, offsetX: 2, offsetY: 3 },
      }));
      expect(ctx.shadowColor).toBe('');
      expect(ctx.shadowBlur).toBe(0);
    });

    it('uses auto color for shadow (contrast of text color)', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({
        color: '#FFFFFF',
        useAutoColor: false,
        textShadow: { enabled: true, color: '#000000', useAutoColor: true, blur: 3, offsetX: 1, offsetY: 1 },
      }));
      // White text -> contrast shadow should be black
      expect(ctx.shadowColor).toBe('#000000');
    });
  });

  describe('font weight', () => {
    it('includes weight in ctx.font string', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({
        fontWeight: 700,
        fontFamily: 'Playfair Display',
      }));
      expect(ctx.font).toMatch(/^700 /);
      expect(ctx.font).toContain('"Playfair Display"');
    });

    it('uses generic font family without quotes', () => {
      drawTextOverlay(ctx as unknown as CanvasRenderingContext2D, canvasWidth, canvasHeight, border, '#FFFFFF', createSettings({
        fontWeight: 400,
        fontFamily: 'monospace',
      }));
      expect(ctx.font).toMatch(/^400 /);
      expect(ctx.font).toContain('monospace');
      expect(ctx.font).not.toContain('"monospace"');
    });
  });
});
