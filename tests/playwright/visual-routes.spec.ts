import { test, expect } from '@playwright/test';

// Helper to normalize visuals (reduce flake): fixed viewport, disable animations, prefer dark mode false.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
});

// Consolidated visual coverage for core routes (lightweight placeholder; real screenshots may be added later)
// Marked essential for potential snapshot baseline in future.
test.describe('@visual-essential Visual Route Smoke', () => {
  const routes = ['/', '/about/', '/projects/', '/blog/', '/contact/'];
  for (const route of routes) {
    test(`visual regression ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
      // Screenshot masking dynamic regions (e.g. time, animated cursor) if any appear; adjust selectors as needed
      await expect(page).toHaveScreenshot(
        route.replace(/\//g, '_').replace(/^_/, '') + '.png',
        {
          animations: 'disabled',
          fullPage: true,
          mask: [
            // add selectors for dynamic regions to mask
          ],
          maskColor: '#ffffff'
        }
      );
    });
  }
});