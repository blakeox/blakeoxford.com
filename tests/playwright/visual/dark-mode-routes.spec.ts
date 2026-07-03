import { test } from '../fixtures';
import { preparePage, snapshotRoute } from './_visualHelper';

// Dark-mode visual baselines for core content routes.
// Tags: @essential @visual-dark @visual-content
const darkRoutes = ['/', '/about/', '/projects/', '/blog/'];

test.describe('@essential @visual-dark @visual-content Dark Mode Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await preparePage(page, 'dark');
  });

  for (const route of darkRoutes) {
    test(`dark mode visual ${route}`, async ({ page }) => {
      await snapshotRoute(page, route, { theme: 'dark' });
    });
  }
});
