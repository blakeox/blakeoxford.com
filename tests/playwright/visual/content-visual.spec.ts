import { test } from '../fixtures';
import { preparePage, snapshotRoute } from './_visualHelper';

// Content pages: mostly static marketing / informational
// Tags: @visual-essential @visual-content
const contentRoutes = ['/', '/about/', '/projects/', '/blog/'];

test.describe('@extended @visual-content Content Visual Regression', () => {
  test.beforeEach(async ({ page }) => { await preparePage(page); });
  for (const route of contentRoutes) {
    test(`content visual ${route}`, async ({ page }) => {
      // Thresholds and masks are centrally managed in _visualHelper
      await snapshotRoute(page, route);
    });
  }
});