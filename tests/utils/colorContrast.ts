/**
 * Shared color-contrast helpers for Playwright accessibility specs.
 * Resolves modern CSS color formats (OKLCH, color-mix, etc.) to sRGB via the browser.
 */

import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import type { Page } from '@playwright/test';
import { waitForLayoutStability } from './waits';

export type Rgb = [number, number, number];

export function luminance(r: number, g: number, b: number): number {
  const channel = [r, g, b].map((v) => {
    const normalized = v / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const fgL = luminance(fg[0], fg[1], fg[2]);
  const bgL = luminance(bg[0], bg[1], bg[2]);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseRgbString(raw: string): Rgb | null {
  if (!raw) return null;
  const val = raw.trim().toLowerCase();

  const hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  const rgbMatch = val.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*(?:,|\s)\s*(\d+(?:\.\d+)?)\s*(?:,|\s|\/)\s*(\d+(?:\.\d+)?)/i
  );
  if (rgbMatch) {
    return [
      Math.round(parseFloat(rgbMatch[1])),
      Math.round(parseFloat(rgbMatch[2])),
      Math.round(parseFloat(rgbMatch[3])),
    ];
  }

  return null;
}

/** Injected into page.evaluate – must be self-contained (no imports). */
export const RESOLVE_CSS_COLOR_FN = readFileSync(
  new NodeURL('./colorResolver.browser.js', import.meta.url),
  'utf8'
);

export const SAMPLE_CONTRAST_SELECTORS = [
  'h1',
  'h2',
  'header nav a',
  'main p',
  '.btn, button',
  'footer',
  '.prose blockquote',
  'main li',
  '.card',
] as const;

export const CONTRAST_SKIP_CONTAINER = '[data-a11y-allow-color-contrast], [role="alert"]';

export type ThemeMode = 'light' | 'dark';

/** Force a theme on the document (call after navigation). */
export async function applyThemeOnPage(page: Page, theme: ThemeMode): Promise<void> {
  await page.evaluate((nextTheme) => {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    // Pause theme token transitions so contrast samples settle immediately
    root.style.setProperty('transition', 'none');
    try {
      localStorage.setItem('theme', nextTheme);
      document.cookie = `theme=${encodeURIComponent(nextTheme)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch {
      /* noop */
    }
    for (const prop of ['--color-background', '--color-foreground']) {
      root.style.removeProperty(prop);
    }
  }, theme);

  // Allow islands to hydrate, then re-apply and let any @property transitions finish
  await waitForLayoutStability(page, 1, 400);
  await page.evaluate((nextTheme) => {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
    root.style.setProperty('transition', 'none');
    for (const prop of ['--color-background', '--color-foreground']) {
      root.style.removeProperty(prop);
    }
  }, theme);

  await waitForLayoutStability(page, 2, 600);

  await page.waitForFunction(
    (expected) => {
      const root = document.documentElement;
      if (root.getAttribute('data-theme') !== expected) return false;
      const fg = getComputedStyle(root).getPropertyValue('--color-foreground').trim();
      if (!fg) return false;
      // Light mode foreground is dark (L < 50%); dark mode foreground is light (L > 50%)
      const match = fg.match(/oklch\(\s*([\d.]+)%?/i);
      if (!match) return true;
      const lightness = parseFloat(match[1]);
      const normalized = fg.includes('%') ? lightness : lightness * 100;
      return expected === 'dark' ? normalized > 50 : normalized < 50;
    },
    theme,
    { timeout: 3000 }
  );
}
