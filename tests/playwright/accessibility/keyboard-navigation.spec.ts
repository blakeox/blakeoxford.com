import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation Tests', () => {
  test('should support comprehensive keyboard navigation patterns', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Get all focusable elements
    const focusableElements = await page.locator(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    // Debug information
    console.log('Comprehensive Navigation Debug:');
    console.log(`Browser: ${page.context().browser()?.browserType().name()}, Viewport: ${await page.viewportSize()?.width}x${await page.viewportSize()?.height}`);
    console.log(`Found ${focusableElements.length} focusable elements:`);
    
    for (let i = 0; i < Math.min(focusableElements.length, 30); i++) {
      const element = focusableElements[i];
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const role = await element.getAttribute('role');
      const text = (await element.textContent())?.slice(0, 50) || '';
      console.log(`  ${i + 1}. ${tagName}${role ? `:${role}` : ''} (${text})`);
    }
    
    // Test basic tab navigation
    expect(focusableElements.length).toBeGreaterThan(5);
    
    // Test first few tab stops
    for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('should handle skip links properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test skip link functionality
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href*="#main"]').first();
    await expect(skipLink).toBeFocused();
    
    // Press Enter on skip link
    await page.keyboard.press('Enter');
    
    // Verify focus moved to main content
    const mainContent = page.locator('#main, #main-content, main').first();
    await expect(mainContent).toBeFocused();
  });

  test('should handle escape key for modal dialogs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for elements that can open dialogs - use more specific selectors
    const searchButton = page.locator('#search-toggle, button[aria-label*="search"]').first();
    const mobileMenuButton = page.locator('#nav-toggle, button[aria-label*="menu"], .burger-menu-button').first();
    
    // Test search overlay if exists
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(500); // Give dialog time to open
      
      const searchOverlay = page.locator('#search-overlay, .search-overlay').first();
      if (await searchOverlay.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(searchOverlay).not.toBeVisible({ timeout: 5000 });
      }
    }
    
    // Test mobile menu if exists - need to set mobile viewport for mobile menu to be visible
    const currentViewport = page.viewportSize();
    if (currentViewport && currentViewport.width > 768) {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500); // Give dialog time to open
      
      const mobileMenu = page.locator('#nav-mobile-links, .mobile-menu').first();
      if (await mobileMenu.isVisible()) {
        // Check that mobile menu has active class
        await expect(mobileMenu).toHaveClass(/active/);
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500); // Wait for event handling
        
        // Check that active class was removed (which indicates the escape key worked)
        await expect(mobileMenu).not.toHaveClass(/active/, { timeout: 2000 });
      }
    }
  });
});
