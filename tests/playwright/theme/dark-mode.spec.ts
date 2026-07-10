import { test, expect } from '../fixtures';
import { cycleThemeToResolved, seedThemePreference } from '../../utils/themeActions';
import { waitForTheme } from '../../utils/waits';

test.describe('@essential @theme Dark mode behavior', () => {
  test('toggles theme and updates background tokens', async ({ page }) => {
    await seedThemePreference(page, 'light');
    await page.goto('/');
    await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true, null, {
      timeout: 15000,
    });
    await waitForTheme(page, 'light', 10000);

    const getPageBackground = async () =>
      page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

    const initialBg = await getPageBackground();
    expect(initialBg.length).toBeGreaterThan(0);

    await cycleThemeToResolved(page, 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    const flippedBg = await getPageBackground();
    expect(flippedBg).not.toEqual(initialBg);
  });
});
