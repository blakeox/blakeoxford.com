import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const themeCss = readFileSync(resolve(__dirname, '../../src/styles/theme.css'), 'utf8');

describe('brand token contract', () => {
  it('keeps navy ink primary (hue 255) and steel accent (hue 250)', () => {
    expect(themeCss).toMatch(/--brand-primary:\s*oklch\([^)]*255\)/);
    expect(themeCss).toMatch(/--brand-accent:\s*oklch\([^)]*250\)/);
  });

  it('uses cool fog paper (hue 95) for light surfaces', () => {
    expect(themeCss).toMatch(/--palette-background:\s*oklch\([^)]*95\)/);
  });

  it('bridges section spacing rhythm', () => {
    expect(themeCss).toContain('--space-section-sm');
    expect(themeCss).toContain('--spacing-section-sm');
  });

  it('documents accent-subtle for soft surfaces', () => {
    expect(themeCss).toContain('--color-accent-subtle');
  });

  it('uses accent for unified focus ring color', () => {
    expect(themeCss).toMatch(/--focus-ring-color:\s*var\(--runtime-accent\)/);
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
    expect(themeCss).toContain('--duration-instant');
    expect(themeCss).toContain('--duration-standard');
  });

  it('avoids same-name @theme self-references for brand colors', () => {
    const themeBridgeStart = themeCss.indexOf('@theme inline {');
    const themeBridge = themeCss.slice(themeBridgeStart);
    expect(themeBridge).not.toMatch(/--color-primary:\s*var\(--color-primary\)/);
    expect(themeBridge).toMatch(/--color-primary:\s*var\(--runtime-primary\)/);
    expect(themeBridge).toMatch(/--color-accent:\s*var\(--runtime-accent\)/);
  });

  it('bridges named z-index utilities including chat launcher', () => {
    expect(themeCss).toContain('--z-chat-launcher');
    expect(themeCss).toContain('--z-index-chat-launcher');
  });

  it('bridges layout max-width for max-w-container-2xl', () => {
    expect(themeCss).toContain('--max-width-container-2xl');
    expect(themeCss).toContain('--layout-max-2xl');
  });
});

describe('Tailwind CSS-first entry', () => {
  it('registers typography via @plugin in global.css', () => {
    const globalCss = readFileSync(resolve(__dirname, '../../src/styles/global.css'), 'utf8');
    expect(globalCss).toMatch(/@plugin ['"]@tailwindcss\/typography['"]/);
    expect(globalCss).toContain('@custom-variant dark');
  });

  it('overrides prose plugin vars with semantic tokens', () => {
    const globalCss = readFileSync(resolve(__dirname, '../../src/styles/global.css'), 'utf8');
    expect(globalCss).toContain('@utility prose');
    expect(globalCss).toContain('--tw-prose-body: var(--color-foreground)');
    expect(globalCss).toContain('--tw-prose-links: var(--color-accent-emphasis)');
  });
});

describe('interactive focus ring utility', () => {
  it('defines focus-ring-interactive in components.css', () => {
    const componentsCss = readFileSync(
      resolve(__dirname, '../../src/styles/components.css'),
      'utf8'
    );
    expect(componentsCss).toContain('.focus-ring-interactive');
    expect(componentsCss).toContain('.touch-target');
  });
});
