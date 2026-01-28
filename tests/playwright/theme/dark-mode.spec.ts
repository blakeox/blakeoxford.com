import { test, expect } from '@playwright/test';

test.describe('@essential @theme Dark mode behavior', () => {
  test('toggles theme and updates background tokens', async ({ page }) => {
    // Seed initial theme to light for determinism
    await page.addInitScript(() => {
      try { localStorage.setItem('theme', 'light'); } catch { /* ignore */ }
    });
    await page.goto('/');

    // Ensure initial theme is set by early init (light or dark)
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Wait for theme CSS variable to be available (ensures stylesheets loaded)
    await page.waitForFunction(() => {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
      return !!val;
    }, null, { timeout: 10000 });

    // Helper to read token value and a "probe" element's computed bg using the token
    const getTokenBg = async () => await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());
    const getProbedBg = async () => await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;background: var(--color-background)';
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });

  const initialTokenBg = await getTokenBg();
  const initialEffectiveBg = await getProbedBg();

    // Click theme toggle
    await page.getByRole('button', { name: /theme|dark|light/i }).click({ trial: true }).catch(() => {});
    // Fallback to #theme-toggle if accessible name is non-standard
    const toggle = page.locator('#theme-toggle');
    if (await toggle.count()) {
      await toggle.click();
    }

    // Wait for class to flip and styles to apply
    await page.waitForFunction(
      (wasDark) => document.documentElement.classList.contains('dark') !== wasDark,
      hasDark,
      { timeout: 10000 }
    );

  const flippedTokenBg = await getTokenBg();
  const flippedEffectiveBg = await getProbedBg();

  // Assert the token flips and the effective bg color changes
  expect(flippedTokenBg).not.toEqual(initialTokenBg);
  expect(flippedEffectiveBg).not.toEqual(initialEffectiveBg);

    // Also sanity check that html[data-theme] is in sync
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(dataTheme === 'dark' || dataTheme === 'light').toBeTruthy();
  });
});
