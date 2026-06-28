import { test, expect } from './fixtures';
import { preparePage } from './visual/_visualHelper';

// Consolidated visual coverage for core routes using centralized config
// This is a smoke-only check for core routes without creating/maintaining snapshots.
// Visual snapshots for these routes live in tests/playwright/visual/*.spec.ts using the centralized helper.
test.describe('@visual-smoke Visual Route Smoke', () => {
  test.beforeEach(async ({ page }) => { await preparePage(page); });
  const routes = ['/', '/about/', '/projects/', '/contact/'];
  for (const route of routes) {
    test(`visual regression ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
      // Lightweight smoke: ensure key landmarks exist (do not require visibility)
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
    });
  }
});
