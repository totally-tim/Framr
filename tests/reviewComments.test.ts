// @vitest-environment node

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

function readRootFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('review-comment regressions', () => {
  test('Playwright projects use the managed Chromium browser', () => {
    const config = readRootFile('playwright.config.ts');

    expect(config).toContain("browserName: 'chromium'");
    expect(config).not.toMatch(/channel:\s*['"]chrome['"]/);
  });

  test('the lazy ZIP chunk does not include statically imported file-saver', () => {
    const config = readRootFile('vite.config.ts');

    expect(config).toMatch(/zip:\s*\[\s*['"]jszip['"]\s*\]/);
    expect(config).not.toMatch(/zip:\s*\[[^\]]*['"]file-saver['"]/);
  });
});
