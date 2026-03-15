import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFontUrl, getRecentFonts, addRecentFont, isGenericFont, getFontMeta } from '../fonts';

// Mock localStorage for Node/jsdom
const localStorageStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); }),
  get length() { return Object.keys(localStorageStore).length; },
  key: vi.fn((i: number) => Object.keys(localStorageStore)[i] ?? null),
};
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

describe('getFontUrl', () => {
  it('returns URL for exact weight match', () => {
    const url = getFontUrl('Bungee', 400);
    expect(url).toBeTruthy();
    expect(url).toContain('bungee');
  });

  it('returns closest weight URL when exact weight is unavailable', () => {
    // Bungee only has 400, requesting 700 should still return the 400 URL
    const url = getFontUrl('Bungee', 700);
    expect(url).toBeTruthy();
    expect(url).toContain('bungee');
  });

  it('returns null for unknown font', () => {
    expect(getFontUrl('NonExistentFont', 400)).toBeNull();
  });

  it('returns URL for DSEG7 Classic (bundled font)', () => {
    const url = getFontUrl('DSEG7 Classic', 400);
    expect(url).toBe('/fonts/DSEG7Classic-Regular.woff2');
  });

  it('returns bold URL for DSEG7 Classic weight 700', () => {
    const url = getFontUrl('DSEG7 Classic', 700);
    expect(url).toBe('/fonts/DSEG7Classic-Bold.woff2');
  });
});

describe('isGenericFont', () => {
  it('identifies generic CSS fonts', () => {
    expect(isGenericFont('sans-serif')).toBe(true);
    expect(isGenericFont('serif')).toBe(true);
    expect(isGenericFont('monospace')).toBe(true);
  });

  it('returns false for named fonts', () => {
    expect(isGenericFont('Inter')).toBe(false);
    expect(isGenericFont('DSEG7 Classic')).toBe(false);
  });
});

describe('getFontMeta', () => {
  it('finds font by name', () => {
    const meta = getFontMeta('Orbitron');
    expect(meta).toBeDefined();
    expect(meta!.category).toBe('display');
  });

  it('finds font by family', () => {
    const meta = getFontMeta('sans-serif');
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('Sans-serif');
  });

  it('returns undefined for unknown font', () => {
    expect(getFontMeta('DoesNotExist')).toBeUndefined();
  });
});

describe('getRecentFonts / addRecentFont', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('returns empty array when no recent fonts', () => {
    expect(getRecentFonts()).toEqual([]);
  });

  it('adds and retrieves recent fonts', () => {
    addRecentFont('Inter');
    addRecentFont('Roboto');
    expect(getRecentFonts()).toEqual(['Roboto', 'Inter']);
  });

  it('deduplicates when adding same font again', () => {
    addRecentFont('Inter');
    addRecentFont('Roboto');
    addRecentFont('Inter');
    expect(getRecentFonts()).toEqual(['Inter', 'Roboto']);
  });

  it('caps at 5 fonts', () => {
    addRecentFont('A');
    addRecentFont('B');
    addRecentFont('C');
    addRecentFont('D');
    addRecentFont('E');
    addRecentFont('F');
    const recent = getRecentFonts();
    expect(recent).toHaveLength(5);
    expect(recent[0]).toBe('F');
    expect(recent).not.toContain('A');
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorageStore['framr-recent-fonts'] = 'not valid json';
    expect(getRecentFonts()).toEqual([]);
  });

  it('handles non-array localStorage value', () => {
    localStorageStore['framr-recent-fonts'] = '"just a string"';
    expect(getRecentFonts()).toEqual([]);
  });
});

describe('loadFontInto', () => {
  it('is exported and callable', async () => {
    const { loadFontInto } = await import('../fonts');
    expect(typeof loadFontInto).toBe('function');
  });
});
