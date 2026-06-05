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

  test('the programmatic top-level file picker is hidden from keyboard tab order', () => {
    const appSource = readRootFile('src/components/App.tsx');

    const topLevelPicker = appSource.match(/<input\s+ref=\{fileInputRef\}[\s\S]*?\/>/)?.[0] ?? '';
    expect(topLevelPicker).toContain('className="hidden"');
    expect(topLevelPicker).toContain('tabIndex={-1}');
    expect(topLevelPicker).not.toContain('className="sr-only"');
  });
});
