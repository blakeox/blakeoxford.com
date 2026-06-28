import { test } from '../fixtures';
import { preparePage, snapshotRoute } from './_visualHelper';

// Application / interactive pages
// Tags: @visual-essential @visual-app
const appRoutes = ['/contact/'];

test.describe('@visual-essential @visual-app App Visual Regression', () => {
  test.beforeEach(async ({ page }) => { await preparePage(page); });
  for (const route of appRoutes) {
    test(`app visual ${route}`, async ({ page }) => {
      // Thresholds and masks are centrally managed in _visualHelper
      await snapshotRoute(page, route);
    });
  }
});