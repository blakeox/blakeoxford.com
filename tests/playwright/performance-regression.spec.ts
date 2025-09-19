import { test } from '@playwright/test';
import { capturePerformance, compareWithBaseline, maybePersistUpdatedBaselines } from '../performance/perfBaselineHelper';

const routes = ['/', '/about', '/projects', '/blog'];

for (const route of routes) {
  test(`performance regression ${route}`, async ({ page }) => {
    // Warm-up navigation to reduce cold-start variance (especially in Chromium)
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Network idle is best-effort; continue regardless
    }

    // Reload and measure on a stabilized page load
    await page.reload({ waitUntil: 'load' });
    const metrics = await capturePerformance(page);
    compareWithBaseline(route, metrics);
  });
}

test.afterAll(async () => {
  maybePersistUpdatedBaselines();
});
