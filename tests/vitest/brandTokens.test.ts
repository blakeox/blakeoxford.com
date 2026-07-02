import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const themeCss = readFileSync(resolve(__dirname, '../../src/styles/theme.css'), 'utf8');

describe('brand token contract', () => {
  it('keeps primary indigo at hue 264 and accent cyan at hue 196', () => {
    expect(themeCss).toMatch(/--color-primary:\s*oklch\([^)]*264\)/);
    expect(themeCss).toMatch(/--color-accent:\s*oklch\([^)]*196\)/);
  });

  it('aligns @property accent initial value with accent token hue', () => {
    expect(themeCss).toMatch(/@property --color-accent[\s\S]*?initial-value:\s*oklch\([^)]*196\)/);
  });

  it('documents accent-subtle for expressive-tier surfaces', () => {
    expect(themeCss).toContain('--color-accent-subtle');
    expect(themeCss).toMatch(/Expressive-tier surfaces/);
  });

  it('uses accent for unified focus ring color', () => {
    expect(themeCss).toMatch(/--focus-ring-color:\s*var\(--color-accent\)/);
  });
});

describe('interactive focus ring utility', () => {
  it('defines focus-ring-interactive in components.css', () => {
    const componentsCss = readFileSync(resolve(__dirname, '../../src/styles/components.css'), 'utf8');
    expect(componentsCss).toContain('.focus-ring-interactive');
    expect(componentsCss).toContain('.touch-target');
  });
});
