import { test, expect } from '@playwright/test';

test.describe('Mobile nav auto-hide @essential', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
      timeout: 10000,
    });
  });

  test('hides the header while scrolling down and restores on scroll up', async ({ page }) => {
    await page.mouse.move(195, 400);

    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(40);
    }

    await expect(page.locator('.nav-shell')).toHaveClass(/nav-shell--auto-hidden/);

    for (let i = 0; i < 4; i += 1) {
      await page.mouse.wheel(0, -160);
      await page.waitForTimeout(40);
    }

    await page.waitForFunction(
      () => !document.querySelector('.nav-shell')?.classList.contains('nav-shell--auto-hidden'),
      { timeout: 5000 },
    );
  });

  test('does not auto-hide while the mobile menu is open', async ({ page }) => {
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveClass(/active/);

    await page.evaluate(() => window.scrollTo(0, 360));
    await page.waitForTimeout(100);

    await expect(page.locator('.nav-shell')).not.toHaveClass(/nav-shell--auto-hidden/);
  });
});
