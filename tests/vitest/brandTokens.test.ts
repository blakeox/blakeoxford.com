import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const themeCss = readFileSync(resolve(__dirname, '../../src/styles/theme.css'), 'utf8');

describe('brand token contract', () => {
  it('keeps warm ink primary (hue 55) and brass accent (hue 75)', () => {
    expect(themeCss).toMatch(/--color-primary:\s*oklch\([^)]*55\)/);
    expect(themeCss).toMatch(/--color-accent:\s*oklch\([^)]*75\)/);
  });

  it('documents accent-subtle for soft surfaces', () => {
    expect(themeCss).toContain('--color-accent-subtle');
  });

  it('uses accent for unified focus ring color', () => {
    expect(themeCss).toMatch(/--focus-ring-color:\s*var\(--color-accent\)/);
  });

  it('exposes always-dark overlay and code helpers without parallel *-dark utilities', () => {
    expect(themeCss).toContain('--color-overlay-scrim');
    expect(themeCss).toContain('--color-code-surface');
    expect(themeCss).toContain('--shadow-overlay');
    const themeBridgeStart = themeCss.indexOf('@theme inline {');
    expect(themeBridgeStart).toBeGreaterThan(-1);
    const themeBridge = themeCss.slice(themeBridgeStart);
    expect(themeBridge).not.toMatch(/--color-background-dark:/);
    expect(themeBridge).not.toMatch(/--color-foreground-light:/);
  });

  it('bridges semantic motion durations including moderate', () => {
    expect(themeCss).toContain('--transition-duration-moderate');
    expect(themeCss).toContain('--duration-moderate');
  });
});

describe('interactive focus ring utility', () => {
  it('defines focus-ring-interactive in components.css', () => {
    const componentsCss = readFileSync(resolve(__dirname, '../../src/styles/components.css'), 'utf8');
    expect(componentsCss).toContain('.focus-ring-interactive');
    expect(componentsCss).toContain('.touch-target');
  });
});
