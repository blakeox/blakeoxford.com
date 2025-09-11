import { test } from '@playwright/test';
import { capturePerformance, compareWithBaseline, maybePersistUpdatedBaselines } from '../performance/perfBaselineHelper';

const routes = ['/', '/about', '/projects', '/blog'];

for (const route of routes) {
  test(`performance regression ${route}`, async ({ page }) => {
    await page.goto(route);
    const metrics = await capturePerformance(page);
    compareWithBaseline(route, metrics);
  });
}

test.afterAll(async () => {
  maybePersistUpdatedBaselines();
});
