import { test } from '@playwright/test';
import { preparePage, snapshotRoute } from './_visualHelper';

// Application / interactive pages
// Tags: @visual-essential @visual-app
const appRoutes = ['/contact/'];

test.describe('@visual-essential @visual-app App Visual Regression', () => {
  test.beforeEach(async ({ page }) => { await preparePage(page); });
  for (const route of appRoutes) {
    test(`app visual ${route}`, async ({ page }) => {
      // Slightly more lenient threshold for interactive application pages
      await snapshotRoute(page, route, { diff: { maxDiffPixelRatio: 0.006 } });
    });
  }
});