import { expect, Page } from '@playwright/test';

export async function preparePage(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
}

export async function snapshotRoute(page: Page, route: string, opts: { mask?: string[]; diff?: { maxDiffPixelRatio?: number; maxDiffPixels?: number } } = {}) {
  // Avoid networkidle on pages with lazy widgets; DOMContentLoaded is enough for static capture
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main, [role="main"]').first()).toBeVisible();
  const rawName = route.replace(/\/$/, '').replace(/\//g, '_').replace(/^_/, '');
  const fileName = (rawName || 'home') + '.png';
  // Build base options
  const baseOptions: any = {
    animations: 'disabled',
    fullPage: true,
    mask: [],
    maskColor: '#ffffff',
    maxDiffPixelRatio: opts.diff?.maxDiffPixelRatio ?? 0.005,
    maxDiffPixels: opts.diff?.maxDiffPixels,
  };

  // Apply provided masks
  if (opts.mask?.length) {
    baseOptions.mask = opts.mask.map((sel) => page.locator(sel));
  }

  // Route-specific adjustments
  if (route === '/contact/') {
    const masks = ['#hero .absolute', '#contact-info .absolute', '.coin-flip'];
    baseOptions.mask = [...(baseOptions.mask || []), ...masks.map((sel) => page.locator(sel))];
    // Slightly relax for cross-engine blur/gradient differences
    baseOptions.maxDiffPixelRatio = Math.max(baseOptions.maxDiffPixelRatio || 0, 0.02);
    // Chromium rendering variance is a bit higher sometimes; detect by UA
    const ua = (await page.evaluate(() => navigator.userAgent)) || '';
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
      baseOptions.maxDiffPixelRatio = Math.max(baseOptions.maxDiffPixelRatio, 0.025);
    }
  }

  await expect(page).toHaveScreenshot(fileName, baseOptions);
}