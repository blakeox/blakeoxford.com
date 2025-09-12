import { expect, Page } from '@playwright/test';

export async function preparePage(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
}

export async function snapshotRoute(page: Page, route: string, opts: { mask?: string[]; diff?: { maxDiffPixelRatio?: number; maxDiffPixels?: number } } = {}) {
  await page.goto(route, { waitUntil: 'networkidle' });
  await expect(page.locator('main, [role="main"]').first()).toBeVisible();
  await expect(page).toHaveScreenshot(
    route.replace(/\/$/, '').replace(/\//g, '_').replace(/^_/, '') + '.png',
    {
      animations: 'disabled',
      fullPage: true,
      mask: opts.mask?.map(sel => page.locator(sel)) || [],
  maskColor: '#ffffff',
  maxDiffPixelRatio: opts.diff?.maxDiffPixelRatio ?? 0.005,
  maxDiffPixels: opts.diff?.maxDiffPixels
    }
  );
}