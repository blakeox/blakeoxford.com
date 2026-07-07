import { test, expect } from './fixtures';
import { waitForLayoutStability } from './utils/deterministic-waits';

// Tag with @visual-smoke for selective execution
// Minimal set of high-value pages for early layout/render regressions.

const routes = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/projects', name: 'projects' },
  { path: '/contact', name: 'contact' }
];

for (const r of routes) {
  test(`visual smoke: ${r.name} @visual-smoke`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(r.path);
    await page.waitForSelector('main');
    await page.evaluate(async () => {
      try {
        if (document.fonts && 'ready' in document.fonts) {
          await document.fonts.ready;
        }
      } catch {
        /* noop */
      }
    });
    await waitForLayoutStability(page);
    
    // Basic smoke test: ensure page has expected content structure
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    await expect(page).toHaveScreenshot(`${r.name}.png`, {
      fullPage: false,
      animations: 'disabled',
      maxDiffPixelRatio: r.name === 'contact' ? 0.015 : 0.01,
      mask: [
        page.locator('.photo-carousel'),
        page.locator('[name="cf-turnstile-response"]'),
        page.locator('#turnstile-container iframe'),
        page.locator('time'),
      ],
    });
  });
}
