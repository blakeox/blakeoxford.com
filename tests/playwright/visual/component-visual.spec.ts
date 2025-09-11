import { test, expect } from '@playwright/test';
import { preparePage } from './_visualHelper';

// Component-level focused snapshots (smaller surface, faster diff isolation)
// Tags: @visual-essential @visual-components

const componentSelectors: Record<string, { route: string; selector: string }> = {
  navbar: { route: '/', selector: 'header nav' },
  footer: { route: '/', selector: 'footer' },
  searchOverlay: { route: '/', selector: '#search-overlay' }
};

test.describe('@visual-essential @visual-components Component Visual Snapshots', () => {
  for (const [name, cfg] of Object.entries(componentSelectors)) {
    test(`component visual ${name}`, async ({ page }) => {
      await preparePage(page);
      await page.goto(cfg.route, { waitUntil: 'networkidle' });
      // Open search overlay if needed
      if (name === 'searchOverlay') {
        const toggle = page.locator('[data-test="open-search"], button:has-text("Search")').first();
        if (await toggle.isVisible()) await toggle.click();
        await expect(page.locator(cfg.selector)).toBeVisible();
      } else {
        await expect(page.locator(cfg.selector)).toBeVisible();
      }
      const element = page.locator(cfg.selector).first();
      await expect(element).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.01
      });
    });
  }
});
