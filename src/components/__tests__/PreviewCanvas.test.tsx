import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { BorderSettings, CanvasBackground, ImageFile, ResizeSettings } from '../../types';
import { DEFAULT_BORDER_SETTINGS } from '../../utils/constants';
import { PreviewCanvas } from '../PreviewCanvas';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const resizeSettings: ResizeSettings = {
  enabled: false,
  maintainAspect: true,
  unit: 'px',
};

const canvasBackground: CanvasBackground = {
  mode: 'checkerboard',
  color: '#808080',
};

function makeImageFile(): ImageFile {
  return {
    id: 'image-1',
    file: new File(['fake'], 'large.png', { type: 'image/png' }),
    name: 'large.png',
    originalWidth: 1600,
    originalHeight: 1200,
    thumbnailUrl: 'blob:thumbnail',
    status: 'pending',
  };
}

function renderPreview(image: ImageFile | null, borderSettings: BorderSettings = DEFAULT_BORDER_SETTINGS) {
  return (
    <PreviewCanvas
      image={image}
      borderSettings={borderSettings}
      resizeSettings={resizeSettings}
      canvasBackground={canvasBackground}
    />
  );
}

describe('PreviewCanvas decode lifecycle', () => {
  let getContextSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getContextSpy.mockRestore();
  });

  test('closes a decoded bitmap when selection is cleared before decode finishes', async () => {
    const decode = deferred<ImageBitmap>();
    const close = vi.fn();
    const bitmap = {
      width: 1200,
      height: 800,
      close,
    } as unknown as ImageBitmap;

    vi.stubGlobal('createImageBitmap', vi.fn(() => decode.promise));

    const { rerender } = render(renderPreview(makeImageFile()));

    await waitFor(() => expect(createImageBitmap).toHaveBeenCalledTimes(1));

    rerender(renderPreview(null));
    decode.resolve(bitmap);

    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });
});
