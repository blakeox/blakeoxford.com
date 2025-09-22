import { test } from '@playwright/test';
import { capturePerformance, compareWithBaseline, maybePersistUpdatedBaselines } from '../performance/perfBaselineHelper';
import { waitForLayoutStability } from './utils/deterministic-waits';

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

    // Take two stabilized measurements and use the best (lowest) values to reduce variance
    await page.reload({ waitUntil: 'load' });
    const m1 = await capturePerformance(page);
    // Short deterministic settle (layout stability) then second run
    await waitForLayoutStability(page, { interval: 50, samples: 3 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 1000 });
    } catch {
      // best-effort settle; safe to continue
    }
    await page.reload({ waitUntil: 'load' });
    const m2 = await capturePerformance(page);

    const best = {
      domContentLoaded: Math.min(m1.domContentLoaded, m2.domContentLoaded),
      fcp: Math.min(m1.fcp, m2.fcp),
      load: Math.min(m1.load, m2.load),
      requests: Math.min(m1.requests, m2.requests),
      browser: m2.browser || m1.browser
    };
    compareWithBaseline(route, best);
  });
}

test.afterAll(async () => {
  maybePersistUpdatedBaselines();
});
