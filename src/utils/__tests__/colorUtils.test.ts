import { describe, it, expect } from 'vitest';
import { isValidHex, normalizeHex } from '../colorUtils';

describe('isValidHex', () => {
  it('accepts a full hex with the hash', () => {
    expect(isValidHex('#112233')).toBe(true);
    expect(isValidHex('#FFFFFF')).toBe(true);
    expect(isValidHex('#000000')).toBe(true);
  });

  it('accepts shorthand with the hash', () => {
    expect(isValidHex('#123')).toBe(true);
    expect(isValidHex('#fff')).toBe(true);
  });

  // The reason this function changed: the colour fields let the user type, and
  // a photographer reading a value off a palette types the digits without it.
  it('accepts a bare hex with no leading hash', () => {
    expect(isValidHex('112233')).toBe(true);
    expect(isValidHex('ffffff')).toBe(true);
  });

  it('accepts bare shorthand', () => {
    expect(isValidHex('123')).toBe(true);
    expect(isValidHex('ABC')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isValidHex('#AaBbCc')).toBe(true);
    expect(isValidHex('aAbBcC')).toBe(true);
  });

  it('rejects a partial value, so typing one digit at a time applies nothing', () => {
    expect(isValidHex('')).toBe(false);
    expect(isValidHex('#')).toBe(false);
    expect(isValidHex('1')).toBe(false);
    expect(isValidHex('#11')).toBe(false);
    expect(isValidHex('1122')).toBe(false);
    expect(isValidHex('11223')).toBe(false);
  });

  it('rejects too many digits', () => {
    expect(isValidHex('#1122334')).toBe(false);
    expect(isValidHex('11223344')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(isValidHex('#GGGGGG')).toBe(false);
    expect(isValidHex('zzz')).toBe(false);
    expect(isValidHex('rgb(0,0,0)')).toBe(false);
    expect(isValidHex('##112233')).toBe(false);
    expect(isValidHex('#11223 ')).toBe(false);
    expect(isValidHex(' #112233')).toBe(false);
  });
});

describe('normalizeHex', () => {
  it('upper-cases and keeps the hash', () => {
    expect(normalizeHex('#aabbcc')).toBe('#AABBCC');
  });

  it('adds the hash to a bare value', () => {
    expect(normalizeHex('112233')).toBe('#112233');
    expect(normalizeHex('aabbcc')).toBe('#AABBCC');
  });

  it('expands shorthand to six digits', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('123')).toBe('#112233');
    expect(normalizeHex('#fff')).toBe('#FFFFFF');
  });

  it('leaves an already-normal value alone', () => {
    expect(normalizeHex('#112233')).toBe('#112233');
  });

  // Every value isValidHex admits has to come out of normalizeHex as a
  // `#RRGGBB` string, because that is what <input type="color"> requires and
  // what the canvas receives.
  it('normalizes everything isValidHex accepts to #RRGGBB', () => {
    for (const input of ['#112233', '112233', '#123', '123', 'aAbBcC', '#FfF']) {
      expect(isValidHex(input)).toBe(true);
      expect(normalizeHex(input)).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
