import { test, expect } from '../fixtures';
import { seedThemePreference } from '../../utils/themeActions';

test.describe('@essential @theme Dark mode first paint', () => {
  test('hard reload preserves dark theme without flashing to light', async ({ page }) => {
    await seedThemePreference(page, 'dark', { once: false });

    await page.goto('/');
    await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true, null, {
      timeout: 15000,
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto('/blog/');
    await page.waitForLoadState('domcontentloaded');

    const themeOnNavigation = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      preference: document.documentElement.getAttribute('data-theme-preference'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
    }));

    expect(themeOnNavigation.theme).toBe('dark');
    expect(themeOnNavigation.preference).toBe('dark');
    expect(themeOnNavigation.hasDarkClass).toBe(true);
  });
});
