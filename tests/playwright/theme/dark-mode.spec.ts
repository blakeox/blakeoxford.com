import { test, expect } from '../fixtures';
import { cycleThemeToResolved, seedThemePreference } from '../../utils/themeActions';
import { waitForTheme } from '../../utils/waits';

test.describe('@essential @theme Dark mode behavior', () => {
  test('toggles theme and updates document theme state', async ({ page }) => {
    await seedThemePreference(page, 'light');
    await page.goto('/');
    await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true, null, {
      timeout: 15000,
    });
    await waitForTheme(page, 'light', 10000);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');

    await cycleThemeToResolved(page, 'dark');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  });
});
