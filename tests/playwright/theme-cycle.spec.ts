import { test, expect } from './fixtures';
import { waitForTheme } from '../utils/waits';
import { seedThemePreference } from '../utils/themeActions';

test.describe('@essential Theme preference cycling', () => {
  test('theme control cycles through preferences', async ({ page }) => {
    await seedThemePreference(page, 'light');

    await page.goto('/');
    await page.waitForFunction(() => (window as any).__navHydrated === true, null, { timeout: 15000 });
    await waitForTheme(page, 'light', 5000);

    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toHaveAttribute('data-theme-preference', 'light');

    await toggle.click();
    await waitForTheme(page, 'dark', 5000);
    await expect(toggle).toHaveAttribute('data-theme-preference', 'dark');

    await toggle.click();
    await expect(toggle).toHaveAttribute('data-theme-preference', 'system');

    await toggle.click();
    await waitForTheme(page, 'light', 5000);
    await expect(toggle).toHaveAttribute('data-theme-preference', 'light');
  });
});
