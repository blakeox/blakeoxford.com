import { test, expect } from '@playwright/test';

async function waitForNavHydration(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => (window as Window & { __navHydrated?: boolean }).__navHydrated === true, {
    timeout: 10000,
  });
}

async function scrollDown(page: import('@playwright/test').Page, steps = 6, delta = 120) {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(40);
  }
}

async function scrollUp(page: import('@playwright/test').Page, steps = 4, delta = -160) {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(40);
  }
}

test.describe('Mobile nav auto-hide @essential', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForNavHydration(page);
  });

  test('hides the header while scrolling down and restores on scroll up', async ({ page }) => {
    await page.mouse.move(195, 400);
    await scrollDown(page);

    await expect(page.locator('.nav-shell')).toHaveClass(/nav-shell--auto-hidden/);

    await scrollUp(page);

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

test.describe('Desktop nav auto-hide @essential', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await waitForNavHydration(page);
  });

  test('hides the header while scrolling down and restores on scroll up', async ({ page }) => {
    await page.mouse.move(640, 400);
    await scrollDown(page);

    await expect(page.locator('.nav-shell')).toHaveClass(/nav-shell--auto-hidden/);

    await scrollUp(page);

    await page.waitForFunction(
      () => !document.querySelector('.nav-shell')?.classList.contains('nav-shell--auto-hidden'),
      { timeout: 5000 },
    );
  });

  test('does not auto-hide while command center is open', async ({ page }) => {
    await page.locator('#search-toggle').click();
    await expect(page.locator('#search-overlay')).toHaveAttribute('data-state', 'open');

    await scrollDown(page, 4, 180);

    await expect(page.locator('.nav-shell')).not.toHaveClass(/nav-shell--auto-hidden/);
  });
});
