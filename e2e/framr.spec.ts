import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const FIXTURE_DIR = path.join(process.cwd(), '.playwright-fixtures');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

async function writeSolidPng(filename: string, width: number, height: number, rgba: [number, number, number, number]): Promise<string> {
  await mkdir(FIXTURE_DIR, { recursive: true });
  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y++) {
    const row = y * rowLength;
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const offset = row + 1 + x * 4;
      raw[offset] = rgba[0];
      raw[offset + 1] = rgba[1];
      raw[offset + 2] = rgba[2];
      raw[offset + 3] = rgba[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const file = Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 1 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  const filePath = path.join(FIXTURE_DIR, filename);
  await writeFile(filePath, file);
  return filePath;
}

async function writeTextFixture(filename: string, contents: string): Promise<string> {
  await mkdir(FIXTURE_DIR, { recursive: true });
  const filePath = path.join(FIXTURE_DIR, filename);
  await writeFile(filePath, contents, 'utf8');
  return filePath;
}

async function uploadImages(page: Page, files: string | string[]): Promise<void> {
  const fileInput = page.locator('input[type="file"]').last();
  await fileInput.setInputFiles(files);
}

async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    htmlScrollWidth: document.documentElement.scrollWidth,
    htmlScrollHeight: document.documentElement.scrollHeight,
    bodyScrollWidth: document.body.scrollWidth,
    bodyScrollHeight: document.body.scrollHeight,
  }));

  expect(metrics.htmlScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.htmlScrollHeight, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.bodyScrollHeight, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportHeight + 1);
}

async function expectVisibleWithinViewport(page: Page, selector: string): Promise<void> {
  const box = await page.locator(selector).boundingBox();
  expect(box, selector).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport, selector).not.toBeNull();
  expect(box!.x, selector).toBeGreaterThanOrEqual(0);
  expect(box!.y, selector).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, selector).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height, selector).toBeLessThanOrEqual(viewport!.height + 1);
}

test.describe('Framr browser flows', () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(browserName !== 'chromium' || testInfo.project.name !== 'chrome-desktop', 'desktop-only flow coverage');
  });

  test('rejects unsupported files without leaving the empty state', async ({ page }) => {
    const unsupported = await writeTextFixture('notes.txt', 'not an image');

    await page.goto('/');
    await uploadImages(page, unsupported);

    await expect(page.getByText('1 file skipped — unsupported format')).toBeVisible();
    await expect(page.getByText('Drop negatives here')).toBeVisible();
    await expect(page.getByRole('button', { name: /Process/ })).toHaveCount(0);
    await expectNoDocumentOverflow(page);
  });

  test('keeps controls reachable when a large image is zoomed to 100%', async ({ page }) => {
    const large = await writeSolidPng('large-landscape-4200x2800.png', 4200, 2800, [40, 80, 120, 255]);

    await page.goto('/');
    await uploadImages(page, large);

    await expect(page.getByLabel('Loaded images').getByText('large-landscape-4200x2800.png')).toBeVisible();
    await expect(page.getByLabel('Loaded images').getByText('4200 × 2800')).toBeVisible();

    await page.getByRole('button', { name: '100%' }).click();

    await expect(page.getByRole('button', { name: 'Fit' })).toBeVisible();
    await expect(page.getByRole('button', { name: '100%' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Process All Image' })).toBeVisible();
    await expectNoDocumentOverflow(page);
    await expectVisibleWithinViewport(page, 'header');
    await expectVisibleWithinViewport(page, 'footer');
  });

  test('saves, applies, renames, persists, and deletes a custom preset', async ({ page }) => {
    const fixture = await writeSolidPng('preset-subject-1200x800.png', 1200, 800, [160, 110, 70, 255]);

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await uploadImages(page, fixture);

    await page.getByRole('button', { name: 'Black 10% preset' }).click();
    await page.getByRole('button', { name: 'Save current settings as a preset' }).click();
    await page.getByPlaceholder('Preset name…').fill('Heavy Black');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('button', { name: 'Apply preset Heavy Black, selected' })).toBeVisible();

    await page.getByRole('button', { name: 'White 3% preset' }).click();
    await expect(page.getByRole('button', { name: 'Apply preset Heavy Black' })).toBeVisible();

    await page.getByRole('button', { name: 'Apply preset Heavy Black' }).click();
    await expect(page.getByRole('button', { name: 'Black 10% preset, selected' })).toBeVisible();

    await page.reload();
    await uploadImages(page, fixture);
    await expect(page.getByRole('button', { name: 'Apply preset Heavy Black' })).toBeVisible();

    await page.getByRole('button', { name: 'Rename preset Heavy Black' }).click();
    await page.getByRole('textbox', { name: 'Rename preset' }).fill('Matte Black');
    await page.getByRole('textbox', { name: 'Rename preset' }).press('Enter');
    await expect(page.getByRole('button', { name: 'Apply preset Matte Black' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete preset Matte Black' }).click();
    await expect(page.getByRole('button', { name: 'Apply preset Matte Black' })).toHaveCount(0);
  });

  test('quick frame and aspect presets can all be applied without console errors', async ({ page }) => {
    const fixture = await writeSolidPng('preset-grid-1400x1000.png', 1400, 1000, [90, 120, 80, 255]);
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/');
    await uploadImages(page, fixture);

    for (const name of ['White 3%', 'White 5%', 'White 10%', 'Black 3%', 'Black 5%', 'Black 10%']) {
      await page.getByRole('button', { name: `${name} preset` }).click();
      await expect(page.getByRole('button', { name: `${name} preset, selected` })).toBeVisible();
      await expectNoDocumentOverflow(page);
    }

    for (const name of ['Instagram 1:1', 'Instagram 4:5', 'Instagram 3:4', 'Pinterest 2:3', 'Twitter/X 16:9', 'TikTok 9:16']) {
      await page.getByRole('button', { name }).click();
      await expectNoDocumentOverflow(page);
    }

    expect(errors).toEqual([]);
  });

  test('advanced settings, text overlay, theme, and webp export stay functional', async ({ page }) => {
    const fixture = await writeSolidPng('settings-subject-1600x1200.png', 1600, 1200, [95, 130, 170, 255]);

    await page.goto('/');
    await uploadImages(page, fixture);

    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Linear' }).click();
    await page.getByRole('button', { name: 'Sunset' }).click();
    await page.getByRole('switch', { name: 'Show checkerboard background behind the preview canvas' }).click();

    await page.getByRole('button', { name: 'Text Overlay' }).click();
    await page.getByRole('switch', { name: 'Enable text overlay' }).click();
    await page.getByRole('textbox', { name: 'Overlay text' }).fill('FRAMR TEST');
    await page.getByRole('button', { name: 'Top right' }).click();
    await page.getByRole('button', { name: 'Glow' }).click();

    await page.getByRole('button', { name: 'Advanced Settings' }).click();
    const advanced = page.locator('#advanced-settings-region');
    await advanced.getByRole('switch', { name: 'Resize the image before adding a border' }).click();
    await advanced.getByLabel('Width').fill('800');
    await advanced.getByLabel('Format').selectOption('webp');

    await page.getByRole('button', { name: 'Process All Image' }).click();
    await expect(page.getByText('1 image ready')).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('settings-subject-1600x1200_bordered.webp');
    await expectNoDocumentOverflow(page);
  });

  test('processes multiple images and exposes downloads', async ({ page }) => {
    const one = await writeSolidPng('batch-one-900x700.png', 900, 700, [120, 70, 140, 255]);
    const two = await writeSolidPng('batch-two-700x900.png', 700, 900, [80, 140, 120, 255]);

    await page.goto('/');
    await uploadImages(page, [one, two]);

    await page.getByRole('button', { name: 'Process All Images' }).click();
    await expect(page.getByText('2 images ready')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Download All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ZIP' })).toBeVisible();
  });
});

test.describe('Framr mobile layout', () => {
  test('keeps primary controls usable with a large image', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chrome-desktop', 'mobile-only coverage');

    const large = await writeSolidPng(`mobile-large-${testInfo.project.name}.png`, 3600, 2400, [40, 90, 110, 255]);

    await page.goto('/');
    await uploadImages(page, large);

    await expect(page.getByRole('button', { name: '100%' })).toBeVisible();
    await page.getByRole('button', { name: '100%' }).click();
    await expect(page.getByRole('button', { name: 'Process (1)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View images (1)' })).toBeVisible();
    await expectNoDocumentOverflow(page);

    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save current settings as a preset' })).toBeVisible();
  });
});
