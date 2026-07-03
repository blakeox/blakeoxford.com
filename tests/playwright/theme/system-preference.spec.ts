import { test, expect } from '../fixtures';
import { waitForTheme } from '../../utils/waits';
import { seedThemePreference } from '../../utils/themeActions';

test.describe('@essential @theme System preference listener', () => {
  test('follows OS color scheme without persisting explicit theme', async ({ page }) => {
    await seedThemePreference(page, 'system');
    await page.emulateMedia({ colorScheme: 'light' });

    await page.goto('/');
    await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true, null, {
      timeout: 15000,
    });
    await waitForTheme(page, 'light', 5000);

    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await waitForTheme(page, 'dark', 5000);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');

    const storedAfterDark = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedAfterDark).toBe('system');

    await page.emulateMedia({ colorScheme: 'light' });
    await waitForTheme(page, 'light', 5000);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const storedAfterLight = await page.evaluate(() => localStorage.getItem('theme'));
    expect(storedAfterLight).toBe('system');
  });

  test('does not override explicit dark preference when OS switches to light', async ({ page }) => {
    await seedThemePreference(page, 'dark');
    await page.emulateMedia({ colorScheme: 'light' });

    await page.goto('/');
    await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true, null, {
      timeout: 15000,
    });
    await waitForTheme(page, 'dark', 5000);

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => page.locator('html').getAttribute('data-theme')).toBe('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');
  });
});
