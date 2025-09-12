import { test } from '@playwright/test';
import { preparePage, snapshotRoute } from './_visualHelper';

// Content pages: mostly static marketing / informational
// Tags: @visual-essential @visual-content
const contentRoutes = ['/', '/about/', '/projects/', '/blog/'];

test.describe('@visual-essential @visual-content Content Visual Regression', () => {
  test.beforeEach(async ({ page }) => { await preparePage(page); });
  for (const route of contentRoutes) {
    test(`content visual ${route}`, async ({ page }) => {
      // Reasonable threshold for cross-browser rendering variance
      await snapshotRoute(page, route, { diff: { maxDiffPixelRatio: 0.01 } });
    });
  }
});