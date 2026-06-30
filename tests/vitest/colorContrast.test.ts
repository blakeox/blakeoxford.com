import { describe, it, expect } from 'vitest';
import { contrastRatio, luminance, parseRgbString } from '../utils/colorContrast';

describe('colorContrast utilities', () => {
  it('parses rgb and hex strings', () => {
    expect(parseRgbString('rgb(17, 24, 39)')).toEqual([17, 24, 39]);
    expect(parseRgbString('#111827')).toEqual([17, 24, 39]);
    expect(parseRgbString('oklch(0.2 0.02 264)')).toBeNull();
  });

  it('computes high contrast for dark-on-light', () => {
    const dark: [number, number, number] = [17, 24, 39];
    const light: [number, number, number] = [248, 250, 252];
    expect(contrastRatio(dark, light)).toBeGreaterThan(10);
  });

  it('computes low contrast for similar colors', () => {
    const a: [number, number, number] = [200, 200, 200];
    const b: [number, number, number] = [210, 210, 210];
    expect(contrastRatio(a, b)).toBeLessThan(2);
  });

  it('calculates luminance monotonically', () => {
    expect(luminance(0, 0, 0)).toBeLessThan(luminance(255, 255, 255));
  });
});
