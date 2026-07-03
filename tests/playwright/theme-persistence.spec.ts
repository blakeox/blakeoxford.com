import { test, expect } from './fixtures';
import { waitForIdle, waitForTheme } from '../utils/waits';
import { cycleThemeToResolved, seedThemePreference } from '../utils/themeActions';

test.describe('Theme persistence across navigation', () => {
  test('dark mode persists after navigation and reload @essential', async ({ page }) => {
    await seedThemePreference(page, 'light');
    await page.goto('/');
    await waitForIdle(page);

    const hasThemeSystem = await page.evaluate(() => !!document.getElementById('theme-toggle'));
    test.skip(!hasThemeSystem, 'Theme toggle not present');

    const htmlHasDark = async () => await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const getThemeAttr = async () => await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    await waitForTheme(page, 'light', 5000);
    await cycleThemeToResolved(page, 'dark');

    const targetTheme = 'dark';
    await expect.poll(getThemeAttr).toBe(targetTheme);

    const classMatches = await page.evaluate(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const attr = document.documentElement.getAttribute('data-theme');
      return (isDark && attr === 'dark') || (!isDark && attr === 'light');
    });
    expect(classMatches).toBeTruthy();

    await page.goto('/about/');
    await waitForIdle(page);
    await expect.poll(getThemeAttr).toBe(targetTheme);
    expect(await htmlHasDark()).toBeTruthy();

    await page.reload();
    await waitForIdle(page);
    await expect.poll(getThemeAttr).toBe(targetTheme);
    expect(await htmlHasDark()).toBeTruthy();
  });
});
