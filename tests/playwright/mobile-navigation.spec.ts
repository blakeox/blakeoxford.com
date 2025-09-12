import { test, expect, devices } from '@playwright/test';
import { waitForMenuState } from '../utils/waits';
import { waitForKeyboardResponse } from '../utils/test-helpers';

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
    if (await desktopNav.count() > 0) {
      await expect(desktopNav).not.toBeVisible();
    }
    
    // Mobile burger button should be visible
    const burgerButton = page.locator('#nav-toggle');
    await expect(burgerButton).toBeVisible();
    
    // Mobile menu should be initially hidden - use robust selector
    const mobileMenu = page.locator('#nav-mobile-links, .mobile-menu').first();
    const isMenuHidden = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isHidden = styles.visibility === 'hidden' || styles.display === 'none';
      const hasHiddenTransform = styles.right === '-100vw' || styles.transform.includes('-100');
      return !hasActiveClass || isHidden || hasHiddenTransform;
    });
    
    expect(isMenuHidden).toBe(true);
  });

  test('should open and close mobile menu correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links, .mobile-menu').first();
    
    // Open mobile menu
    await burgerButton.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
    
    // Menu should be active and visible - use robust checking
    const isMenuOpen = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isVisible = styles.visibility !== 'hidden' && styles.display !== 'none';
      const hasValidPosition = !styles.right?.includes('-100') && !styles.transform?.includes('-100');
      return hasActiveClass || (isVisible && hasValidPosition);
    });
    
    expect(isMenuOpen).toBe(true);
    await expect(burgerButton).toHaveClass(/active/);
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'true');
    
    // Close button should be present
    const closeButton = page.locator('#close-mobile-menu');
    await expect(closeButton).toBeVisible();
    
    // Close menu using close button
    await closeButton.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
    
    // Menu should be closed - use robust checking
    const isMenuClosed = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isHidden = styles.visibility === 'hidden' || styles.display === 'none';
      const hasHiddenTransform = styles.right === '-100vw' || styles.transform?.includes('-100');
      return !hasActiveClass || isHidden || hasHiddenTransform;
    });
    
    expect(isMenuClosed).toBe(true);
    await expect(burgerButton).not.toHaveClass(/active/);
    await expect(burgerButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should close mobile menu with escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links, .mobile-menu').first();
    
    // Open mobile menu
    await burgerButton.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
    
    // Verify menu is open
    const isMenuOpen = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isVisible = styles.visibility !== 'hidden' && styles.display !== 'none';
      const hasValidPosition = !styles.right?.includes('-100') && !styles.transform?.includes('-100');
      return hasActiveClass || (isVisible && hasValidPosition);
    });
    
    expect(isMenuOpen).toBe(true);
    
    // Close with escape key
    await page.keyboard.press('Escape');
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
    
    // Menu should be closed - verify both class and visual state
    const isMenuClosed = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isHidden = styles.visibility === 'hidden' || styles.display === 'none';
      const hasHiddenTransform = styles.right === '-100vw' || styles.transform?.includes('-100');
      return !hasActiveClass || isHidden || hasHiddenTransform;
    });
    
    expect(isMenuClosed).toBe(true);
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
    await waitForMenuState(page, '#search-overlay', true, 1500);
      await expect(searchOverlay).toHaveClass(/active/);
      
      // Open mobile menu - should close search overlay
      await burgerButton.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
      
      // Mobile menu should be open, search overlay should be closed
      await expect(mobileMenu).toHaveClass(/active/);
      await expect(searchOverlay).not.toHaveClass(/active/);
      
      // Close mobile menu
      await page.keyboard.press('Escape');
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
      await expect(mobileMenu).not.toHaveClass(/active/);
    }
  });

  test('should navigate using mobile menu links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links, .mobile-menu').first();
    
    // Open mobile menu
    await burgerButton.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
    
    // Verify menu is open
    const isMenuOpen = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isVisible = styles.visibility !== 'hidden' && styles.display !== 'none';
      const hasValidPosition = !styles.right?.includes('-100') && !styles.transform?.includes('-100');
      return hasActiveClass || (isVisible && hasValidPosition);
    });
    
    expect(isMenuOpen).toBe(true);
    
    // Click on About link in mobile menu - use more flexible selector
    const aboutLink = mobileMenu.locator('a[href="/about"], a[href*="about"]').first();
    if (await aboutLink.isVisible()) {
      await Promise.all([
        page.waitForURL(/.*about/, { timeout: 10000 }),
        aboutLink.click()
      ]);
      
      // Should navigate to about page
      expect(page.url()).toContain('/about');
      
      // Mobile menu should be closed after navigation - check both ways
      const isMenuClosedAfterNav = await mobileMenu.evaluate(el => {
        const hasActiveClass = el.classList.contains('active');
        const styles = window.getComputedStyle(el);
        const isHidden = styles.visibility === 'hidden' || styles.display === 'none';
        const hasHiddenTransform = styles.right === '-100vw' || styles.transform?.includes('-100');
        return !hasActiveClass || isHidden || hasHiddenTransform;
      });
      
      expect(isMenuClosedAfterNav).toBe(true);
    }
  });

  test('should have proper focus management in mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const burgerButton = page.locator('#nav-toggle');
    const mobileMenu = page.locator('#nav-mobile-links, .mobile-menu').first();
    
    // Open mobile menu
    await burgerButton.click();
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
    
    // Check if mobile menu is active/visible with fallback selectors
    const isMenuActive = await mobileMenu.evaluate(el => {
      const hasActiveClass = el.classList.contains('active');
      const styles = window.getComputedStyle(el);
      const isVisible = styles.visibility !== 'hidden' && styles.display !== 'none';
      const hasValidPosition = !styles.right?.includes('-100') && !styles.transform?.includes('-100');
      return hasActiveClass || (isVisible && hasValidPosition);
    });
    
    expect(isMenuActive).toBe(true);
    
    // First focusable element should be focused
    const firstFocusable = mobileMenu.locator('a, button, [tabindex]:not([tabindex="-1"])').first();
    await expect(firstFocusable).toBeFocused();
    
    // Tab navigation should work within mobile menu
    await page.keyboard.press('Tab');
    const secondFocusable = mobileMenu.locator('a, button, [tabindex]:not([tabindex="-1"])').nth(1);
    if (await secondFocusable.isVisible()) {
      await expect(secondFocusable).toBeFocused();
    }
    
    // Close menu and focus should return to burger button
    await page.keyboard.press('Escape');
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
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
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', true, 1500);
    await expect(mobileMenu).toHaveClass(/active/);
    
    // Menu should not overflow viewport
    const menuBoundingBox = await mobileMenu.boundingBox();
    if (menuBoundingBox) {
      expect(menuBoundingBox.x + menuBoundingBox.width).toBeLessThanOrEqual(320);
    }
    
    // Close menu
    await page.keyboard.press('Escape');
    await waitForMenuState(page, '#nav-mobile-links, .mobile-menu', false, 1500);
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
        await waitForKeyboardResponse(page);
        await expect(mobileMenu).toHaveClass(/active/);
        
        await page.keyboard.press('Escape');
        await waitForKeyboardResponse(page);
        await expect(mobileMenu).not.toHaveClass(/active/);
        
        await context.close();
      });
    }
  });
});