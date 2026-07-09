import { test, expect } from './fixtures';
import { waitForLayoutStability } from './utils/deterministic-waits';
import { MAX_ALLOWED_TOLERANCE, VISUAL_ROUTE_CONFIG } from './visual/config';

// Tag with @visual-smoke for selective execution
// Minimal set of high-value pages for early layout/render regressions.

const routes = [
  { path: '/', name: 'home' },
  { path: '/about/', name: 'about' },
  { path: '/projects/', name: 'projects' },
  { path: '/contact/', name: 'contact' },
];

function smokeTolerance(path: string, fallback = 0.01) {
  const cfg = VISUAL_ROUTE_CONFIG[path];
  const configured = cfg?.diff?.maxDiffPixelRatio ?? fallback;
  // Linux CI font/layout rasterization can diverge slightly from macOS baselines.
  return Math.min(Math.max(configured, process.env.CI ? MAX_ALLOWED_TOLERANCE : configured), MAX_ALLOWED_TOLERANCE);
}

for (const r of routes) {
  test(`visual smoke: ${r.name} @visual-smoke`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(r.path, { waitUntil: 'domcontentloaded' });
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
      maxDiffPixelRatio: smokeTolerance(r.path, r.name === 'contact' ? 0.015 : 0.01),
      mask: [
        page.locator('.photo-carousel'),
        page.locator('[name="cf-turnstile-response"]'),
        page.locator('#turnstile-container iframe'),
        page.locator('time'),
      ],
    });
  });
}
