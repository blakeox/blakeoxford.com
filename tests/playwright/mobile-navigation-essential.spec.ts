import { devices } from '@playwright/test';
import { test, expect } from './fixtures';

test.describe('Mobile Navigation Essential', () => {
  // Test mobile navigation with viewport simulation (faster than device contexts)
  test('mobile menu should work correctly @critical', async ({ page }) => {
    // Set mobile viewport instead of creating new context
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');

    // Verify mobile menu is present
    await expect(burgerButton).toBeVisible();
    await expect(mobileMenu).toHaveAttribute('data-state', 'closed');

    // Open mobile menu
    await burgerButton.click();
    await expect(mobileMenu).toHaveAttribute('data-state', 'open', { timeout: 3000 });
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'true');

    // Test navigation links are actually visible (not just class toggled)
    const homeLink = mobileMenu.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
    const menuHeight = await mobileMenu.evaluate((el) => el.getBoundingClientRect().height);
    expect(menuHeight).toBeGreaterThan(40);

    // Close with escape key
    await page.keyboard.press('Escape');
    await expect(mobileMenu).toHaveAttribute('data-state', 'closed', { timeout: 3000 });
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should handle search overlay and mobile menu interaction @critical', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const searchToggle = page.locator('#search-toggle');
    const searchOverlay = page.locator('#search-overlay');
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');

    // Open search overlay first
    if (await searchToggle.isVisible()) {
      await searchToggle.click();
      // Wait for overlay to actually activate (active class + inert removed)
      await page.waitForFunction(() => {
        const el = document.querySelector('#search-overlay') as HTMLElement | null;
        if (!el) return false;
        const inert = el.hasAttribute('inert');
        const style = window.getComputedStyle(el);
        return !inert && el.getAttribute('data-state') === 'open' && style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
      }, { timeout: 3000 }).catch(() => {});
      await expect(searchOverlay).toBeVisible({ timeout: 3000 });

      // Close search overlay
      await page.keyboard.press('Escape');
      await expect(searchOverlay).not.toBeVisible({ timeout: 5000 });
    }

    // Ensure overlay is not intercepting pointer events before opening menu
    const overlayIntercepts = await page.evaluate(() => {
      const el = document.querySelector('#search-overlay') as HTMLElement | null;
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return el.getAttribute('data-state') === 'open' || (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0);
    });
    if (overlayIntercepts) {
      // Force close via script using instance method if available
      await page.evaluate(async () => {
        const g: any = window as any;
        if (g.enhancedSearchOverlay && typeof g.enhancedSearchOverlay.closeSearchOverlay === 'function') {
          g.enhancedSearchOverlay.closeSearchOverlay();
        } else if (g.searchOverlay && typeof g.searchOverlay.closeSearchOverlay === 'function') {
          g.searchOverlay.closeSearchOverlay();
        } else {
          const el = document.getElementById('search-overlay');
          if (el) { el.setAttribute('data-state', 'closed'); el.setAttribute('inert', ''); el.classList.add('hidden'); }
        }
      });
      await expect(searchOverlay).not.toBeVisible({ timeout: 5000 });
    }

    // Test mobile menu after search interaction
    await burgerButton.click();
    await expect(mobileMenu).toHaveAttribute('data-state', 'open', { timeout: 3000 });

    // Close mobile menu
    await page.keyboard.press('Escape');
    await expect(mobileMenu).toHaveAttribute('data-state', 'closed', { timeout: 3000 });
  });

  // Test key device categories instead of every device
  test.describe('Key Device Categories', () => {
    const keyDevices = [
      'iPhone 14 Pro Max', // Latest large iPhone
      'Pixel 7', // Modern Android
    ];

    keyDevices.forEach((deviceName) => {
      test(`should work on ${deviceName} @smoke`, async ({ browser, browserName }) => {
        const device = devices[deviceName];
        if (!device) return; // Skip if device not available

        // Firefox doesn't support isMobile option, so we'll simulate it differently
        let contextOptions;
        if (browserName === 'firefox' && device.isMobile) {
          // For Firefox, use just viewport and userAgent, skip isMobile
          contextOptions = {
            viewport: device.viewport,
            userAgent: device.userAgent,
            // Skip isMobile and hasTouch for Firefox
          };
        } else {
          contextOptions = device;
        }

        const context = await browser.newContext(contextOptions);
        const page = await context.newPage();

        try {
          await page.goto('/');
          await page.waitForLoadState('domcontentloaded');

          const burgerButton = page.locator('#nav-toggle');
          const mobileMenu = page.locator('#nav-mobile-links');

          await expect(burgerButton).toBeVisible();

          // Quick functionality test
          await burgerButton.click();
          await expect(mobileMenu).toHaveAttribute('data-state', 'open', { timeout: 3000 });

          await page.keyboard.press('Escape');
          await expect(mobileMenu).toHaveAttribute('data-state', 'closed', { timeout: 3000 });

        } finally {
          await context.close();
        }
      });
    });
  });
});

test.describe('Mobile Responsive Layout', () => {
  const breakpoints = [
    { name: 'Mobile Small', width: 320, height: 568 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
  ];

  breakpoints.forEach(({ name, width, height }) => {
    test(`should be responsive at ${name} (${width}x${height}) @smoke`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Check if mobile menu appears at mobile breakpoints
      const burgerButton = page.locator('#nav-toggle');

      if (width < 768) {
        // Mobile breakpoint - burger menu should be visible
        await expect(burgerButton).toBeVisible();
      }

      // Ensure page loads without errors
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('main h1, [role="main"] h1, body > section h1').first()).toBeVisible();
    });
  });
});
