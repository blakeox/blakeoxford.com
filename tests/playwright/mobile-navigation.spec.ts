import { test, expect, devices } from '@playwright/test';

// Test mobile navigation specifically
test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  });

  test('should display mobile burger menu on small screens', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Desktop nav should be hidden on mobile
    const desktopNav = page.locator('.desktop-nav');
    await expect(desktopNav).not.toBeVisible();
    
    // Mobile burger button should be visible
    const burgerButton = page.locator('#nav-toggle');
    await expect(burgerButton).toBeVisible();
    
    // Mobile menu should be initially hidden
    const mobileMenu = page.locator('#nav-mobile-links');
    await expect(mobileMenu).not.toHaveClass(/active/);
  });

  test('should open and close mobile menu correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Open mobile menu
    await burgerButton.click();
    await page.waitForTimeout(350); // Wait for animation
    
    // Menu should be active and visible
    await expect(mobileMenu).toHaveClass(/active/);
    await expect(burgerButton).toHaveClass(/active/);
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'true');
    
    // Close button should be present
    const closeButton = page.locator('#close-mobile-menu');
    await expect(closeButton).toBeVisible();
    
    // Close menu using close button
    await closeButton.click();
    await page.waitForTimeout(350); // Wait for animation
    
    // Menu should be closed
    await expect(mobileMenu).not.toHaveClass(/active/);
    await expect(burgerButton).not.toHaveClass(/active/);
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should close mobile menu with escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Open mobile menu
    await burgerButton.click();
    await page.waitForTimeout(350);
    await expect(mobileMenu).toHaveClass(/active/);
    
    // Close with escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    
    // Menu should be closed
    await expect(mobileMenu).not.toHaveClass(/active/);
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should handle search overlay and mobile menu correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const searchToggle = page.locator('#search-toggle');
    const searchOverlay = page.locator('#search-overlay');
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Open search overlay first
    if (await searchToggle.isVisible()) {
      await searchToggle.click();
      await page.waitForTimeout(350);
      await expect(searchOverlay).toHaveClass(/active/);
      
      // Open mobile menu - should close search overlay
      await burgerButton.click();
      await page.waitForTimeout(350);
      
      // Mobile menu should be open, search overlay should be closed
      await expect(mobileMenu).toHaveClass(/active/);
      await expect(searchOverlay).not.toHaveClass(/active/);
      
      // Close mobile menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
      await expect(mobileMenu).not.toHaveClass(/active/);
    }
  });

  test('should navigate using mobile menu links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Open mobile menu
    await burgerButton.click();
    await page.waitForTimeout(350);
    await expect(mobileMenu).toHaveClass(/active/);
    
    // Click on About link in mobile menu
    const aboutLink = mobileMenu.locator('a[href="/about"]');
    if (await aboutLink.isVisible()) {
      await Promise.all([
        page.waitForURL(/.*about/, { timeout: 10000 }),
        aboutLink.click()
      ]);
      
      // Should navigate to about page
      expect(page.url()).toContain('/about');
      
      // Mobile menu should be closed after navigation
      await expect(mobileMenu).not.toHaveClass(/active/);
    }
  });

  test('should have proper focus management in mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Open mobile menu
    await burgerButton.click();
    await page.waitForTimeout(350);
    await expect(mobileMenu).toHaveClass(/active/);
    
    // First focusable element should be focused
    const firstFocusable = mobileMenu.locator('a, button').first();
    await expect(firstFocusable).toBeFocused();
    
    // Tab navigation should work within mobile menu
    await page.keyboard.press('Tab');
    const secondFocusable = mobileMenu.locator('a, button').nth(1);
    if (await secondFocusable.isVisible()) {
      await expect(secondFocusable).toBeFocused();
    }
    
    // Close menu and focus should return to burger button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    await expect(burgerButton).toBeFocused();
  });

  test('should work correctly on very small screens', async ({ page }) => {
    // Test on very small screen (320px width)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links');
    
    // Burger button should still be visible and functional
    await expect(burgerButton).toBeVisible();
    
    // Open mobile menu
    await burgerButton.click();
    await page.waitForTimeout(350);
    await expect(mobileMenu).toHaveClass(/active/);
    
    // Menu should not overflow viewport
    const menuBoundingBox = await mobileMenu.boundingBox();
    if (menuBoundingBox) {
      expect(menuBoundingBox.x + menuBoundingBox.width).toBeLessThanOrEqual(320);
    }
    
    // Close menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    await expect(mobileMenu).not.toHaveClass(/active/);
  });
});

// Test specific mobile devices
test.describe('Mobile Device Navigation', () => {
  Object.entries(devices).forEach(([deviceName, device]) => {
    if (deviceName.includes('iPhone') || deviceName.includes('Pixel')) {
      test(`should work on ${deviceName}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        
        // Basic functionality test
        const burgerButton = page.locator('#nav-toggle');
        const mobileMenu = page.locator('#nav-mobile-links');
        
        await expect(burgerButton).toBeVisible();
        
        await burgerButton.click();
        await page.waitForTimeout(350);
        await expect(mobileMenu).toHaveClass(/active/);
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(350);
        await expect(mobileMenu).not.toHaveClass(/active/);
        
        await context.close();
      });
    }
  });
});