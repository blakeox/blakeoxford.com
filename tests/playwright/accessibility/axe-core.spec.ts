import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Core automated accessibility scan across key routes
// Tagged as essential but can be split later if performance issues arise.

test.describe('@essential @accessibility-core Axe Accessibility Scan', () => {
  const routes = ['/', '/about', '/projects', '/blog'];

  for (const route of routes) {
    test(`axe scan ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      if (results.violations.length) {
        console.log(`Axe violations on ${route}:`, results.violations.map(v => `${v.id} (${v.impact})`).join(', '));
      }
      // Simple sanity: main landmark present
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    });
  }
});
