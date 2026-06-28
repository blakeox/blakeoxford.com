import { test, expect } from '../fixtures';

test.describe('Skip link and focus management', () => {
  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('#main-content');
    await page.locator('a.skip-link[href="#main-content"]').focus();
    // Activate skip link via keyboard to mimic a11y behavior
    await page.keyboard.press('Enter');
    await expect(main).toBeFocused();
  });
});
