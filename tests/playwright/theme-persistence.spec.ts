import { test, expect } from '@playwright/test';
import { waitForIdle, waitForTheme } from '../utils/waits';

// Contract
// - Input: user clicks theme toggle to switch to dark
// - Behavior: html[data-theme="dark"] and .dark class persist across navigation and reload
// - Error mode: if theme system absent, test should skip gracefully

test.describe('Theme persistence across navigation', () => {
  test('dark mode persists after navigation and reload @essential', async ({ page }) => {
    await page.goto('/');
    await waitForIdle(page);

    const hasThemeSystem = await page.evaluate(() => !!document.getElementById('theme-toggle'));
    test.skip(!hasThemeSystem, 'Theme toggle not present');

    const htmlHasDark = async () => await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const getThemeAttr = async () => await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    // Determine current theme and target
    const initialTheme = await getThemeAttr();
    const targetTheme = initialTheme === 'dark' ? 'light' : 'dark';

    // Toggle theme
    await page.locator('#theme-toggle').click({ trial: true }).catch(() => {});
    await page.locator('#theme-toggle').click({ force: true });

    await waitForTheme(page, targetTheme);
    await expect.poll(getThemeAttr).toBe(targetTheme);

    // Verify class alignment with attribute
    const classMatches = await page.evaluate(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const attr = document.documentElement.getAttribute('data-theme');
      return (isDark && attr === 'dark') || (!isDark && attr === 'light');
    });
    expect(classMatches).toBeTruthy();

    // Navigate to About and assert persistence
    await page.goto('/about/');
    await waitForIdle(page);
    await expect.poll(getThemeAttr).toBe(targetTheme);
    if (targetTheme === 'dark') {
      expect(await htmlHasDark()).toBeTruthy();
    } else {
      expect(await htmlHasDark()).toBeFalsy();
    }

    // Reload and verify persistence survives full page load
    await page.reload();
    await waitForIdle(page);
    await expect.poll(getThemeAttr).toBe(targetTheme);
    if (targetTheme === 'dark') {
      expect(await htmlHasDark()).toBeTruthy();
    } else {
      expect(await htmlHasDark()).toBeFalsy();
    }
  });
});
