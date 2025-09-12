import { test, expect } from '@playwright/test';

// Lightweight contrast ratio check for key text elements.
// Tags: @accessibility-extended
// NOTE: This is a heuristic complement to axe-core; for full coverage rely on axe baseline.

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(rgb1: number[], rgb2: number[]) {
  const L1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const L2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}


const sampleSelectors = [
  'h1', 'h2', 'header nav a', 'main p', '.btn, button', 'footer'
];

// Minimum contrast ratios: 4.5 for normal text, 3.0 for large (>=24px or >=18.66px bold)

test.describe('@accessibility-extended Contrast Ratios', () => {
  const routes = ['/', '/about/', '/projects/', '/blog/'];
  for (const route of routes) {
    test(`contrast ratios acceptable ${route}`, async ({ page }) => {
      await page.goto(route);
      for (const sel of sampleSelectors) {
        const elements = await page.locator(sel).elementHandles();
        for (const el of elements.slice(0, 5)) { // cap per selector for speed
          const handle = el;
          const { fg, bg } = await handle.evaluate((node: any) => {
            const style = window.getComputedStyle(node);
            const parse = (c: string) => c.match(/\d+/g)?.slice(0,3).map(Number) || [0,0,0];
            let bgCol = style.backgroundColor;
            let current: HTMLElement | null = node;
            while (bgCol === 'rgba(0, 0, 0, 0)' && current?.parentElement) {
              const s = window.getComputedStyle(current.parentElement);
              bgCol = s.backgroundColor;
              current = current.parentElement;
            }
            return { fg: parse(style.color), bg: parse(bgCol), fontSize: style.fontSize, fontWeight: style.fontWeight };
          });
          const ratio = contrast(fg, bg);
          const large = await handle.evaluate((n: any) => {
            const style = window.getComputedStyle(n);
            const size = parseFloat(style.fontSize);
            const weight = parseInt(style.fontWeight, 10) || 400;
            return size >= 24 || (size >= 18.66 && weight >= 700);
          });
          const min = large ? 3.0 : 4.5;
          expect(ratio, `Contrast ${ratio.toFixed(2)} < ${min} for selector ${sel} on ${route}`).toBeGreaterThanOrEqual(min);
        }
      }
    });
  }
});
