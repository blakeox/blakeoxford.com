import { test, expect, devices } from '@playwright/test';

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
    await expect(mobileMenu).not.toHaveClass(/active/);
    
    // Open mobile menu
    await burgerButton.click();
    await expect(mobileMenu).toHaveClass(/active/, { timeout: 3000 });
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'true');
    
    // Test navigation links
    const homeLink = mobileMenu.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
    
    // Close with escape key
    await page.keyboard.press('Escape');
    await expect(mobileMenu).not.toHaveClass(/active/, { timeout: 3000 });
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
      await expect(searchOverlay).toBeVisible({ timeout: 3000 });
      
      // Close search overlay
      await page.keyboard.press('Escape');
      await expect(searchOverlay).not.toBeVisible({ timeout: 3000 });
    }
    
    // Test mobile menu after search interaction
    await burgerButton.click();
    await expect(mobileMenu).toHaveClass(/active/, { timeout: 3000 });
    
    // Close mobile menu
    await page.keyboard.press('Escape');
    await expect(mobileMenu).not.toHaveClass(/active/, { timeout: 3000 });
  });

  // Test key device categories instead of every device
  test.describe('Key Device Categories', () => {
    const keyDevices = [
      'iPhone 14 Pro Max', // Latest large iPhone
      'Pixel 7', // Modern Android
    ];

    keyDevices.forEach((deviceName) => {
      test(`should work on ${deviceName} @smoke`, async ({ browser }) => {
        const device = devices[deviceName];
        if (!device) return; // Skip if device not available
        
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        try {
          await page.goto('/');
          await page.waitForLoadState('domcontentloaded');
          
          const burgerButton = page.locator('#nav-toggle');
          const mobileMenu = page.locator('#nav-mobile-links');
          
          await expect(burgerButton).toBeVisible();
          
          // Quick functionality test
          await burgerButton.click();
          await expect(mobileMenu).toHaveClass(/active/, { timeout: 3000 });
          
          await page.keyboard.press('Escape');
          await expect(mobileMenu).not.toHaveClass(/active/, { timeout: 3000 });
          
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
      
      if (width <= 768) {
        // Mobile breakpoint - burger menu should be visible
        await expect(burgerButton).toBeVisible();
      }
      
      // Ensure page loads without errors
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
