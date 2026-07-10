import { test, expect } from './fixtures';
import { seedThemePreference, cycleThemeToResolved } from '../utils/themeActions';
import { waitForTheme } from '../utils/waits';

test.describe('Dark mode persistence', () => {
  test('persists theme across navigation and reloads @essential', async ({ page }) => {
    await seedThemePreference(page, 'light');
    await page.goto('/');
    await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true, null, {
      timeout: 15000,
    });
    await page.waitForSelector('#theme-toggle', { state: 'visible' });

    await waitForTheme(page, 'light', 10000);
    await cycleThemeToResolved(page, 'dark');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.goto('/about');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const cookies = await page.context().cookies();
    const themeCookie = cookies.find(c => c.name === 'theme');
    if (themeCookie) {
      expect(themeCookie?.value).toBe('dark');
    } else {
      const lsTheme = await page.evaluate(() => localStorage.getItem('theme'));
      expect(lsTheme).toBe('dark');
    }
  });
});
