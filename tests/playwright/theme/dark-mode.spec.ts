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

    const getTokenBg = async () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());

    const getProbedBg = async () =>
      page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.cssText =
          'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;background:var(--color-background)';
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      });

    const initialTokenBg = await getTokenBg();
    const initialEffectiveBg = await getProbedBg();
    expect(initialTokenBg.length).toBeGreaterThan(0);

    await cycleThemeToResolved(page, 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const flippedTokenBg = await getTokenBg();
    const flippedEffectiveBg = await getProbedBg();

    expect(flippedTokenBg).not.toEqual(initialTokenBg);
    expect(flippedEffectiveBg).not.toEqual(initialEffectiveBg);
  });
});
