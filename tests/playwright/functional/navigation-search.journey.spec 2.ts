import { test, expect } from '@playwright/test';
import { openSearchOverlay, fillSearch, navigateMain } from '../../utils/pageActions';

// Consolidated fast journey combining essential nav + search actions.
// Marked as smoke & journey for selective CI execution.

test.describe('@essential @smoke @journey Navigation & Search Journey', () => {
  test('navigate primary pages', async ({ page }) => {
    await page.goto('/');
    await navigateMain(page, '/about/');
    await navigateMain(page, '/projects/');
    await navigateMain(page, '/blog/');
    await navigateMain(page, '/contact/');
  });

  test('search open, query, and close', async ({ page }) => {
    await page.goto('/');
    await openSearchOverlay(page);
    await fillSearch(page, 'project');
    // Basic assertion: results container exists or empty state still stable
    const results = page.locator('#search-results');
    await expect(results).toBeAttached();
    // Close overlay via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-overlay')).not.toBeVisible();
  });
});
