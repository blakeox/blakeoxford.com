import { test } from '@playwright/test';
import { preparePage, snapshotRoute } from './_visualHelper';

// Content pages: mostly static marketing / informational
// Tags: @visual-essential @visual-content
const contentRoutes = ['/', '/about/', '/projects/', '/blog/'];

test.describe('@visual-essential @visual-content Content Visual Regression', () => {
  test.beforeEach(async ({ page }) => { await preparePage(page); });
  for (const route of contentRoutes) {
    test(`content visual ${route}`, async ({ page }) => {
      // Stricter diff threshold for mostly static content pages
      await snapshotRoute(page, route, { diff: { maxDiffPixelRatio: 0.002 } });
    });
  }
});