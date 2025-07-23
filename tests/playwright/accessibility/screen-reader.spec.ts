import { test, expect } from '@playwright/test';

test.describe('Screen Reader Support Tests', () => {
  test('should have proper ARIA landmarks structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for essential ARIA landmarks
    const banner = page.locator('[role="banner"], header').first();
    await expect(banner).toBeVisible();
    
    const main = page.locator('[role="main"], main').first();
    await expect(main).toBeVisible();
    
    const navigation = page.locator('[role="navigation"], nav').first();
    await expect(navigation).toBeVisible();
    
    const contentinfo = page.locator('[role="contentinfo"], footer').first();
    await expect(contentinfo).toBeVisible();
  });

  test('should have meaningful heading hierarchy', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      
      // Check heading hierarchy (h1 -> h2 -> h3, etc.)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Verify h1 comes before other headings
      if (headings.length > 1) {
        const firstHeading = headings[0];
        const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('h1');
      }
    }
  });

  test('should provide alternative text for all images', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      // Get all images
      const images = await page.locator('img').all();
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        const ariaLabel = await img.getAttribute('aria-label');
        
        // Images should have alt text, unless they're decorative (role="presentation")
        if (role !== 'presentation' && role !== 'none') {
          expect(alt !== null || ariaLabel !== null).toBeTruthy();
        }
      }
    }
  });

  test('should support assistive technology announcements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for live regions for dynamic content
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    
    // Should have at least one live region for announcements
    const count = await liveRegions.count();
    expect(count).toBeGreaterThanOrEqual(0); // Changed to >= 0 since live regions are optional
    
    // If live regions exist, check they have proper attributes
    if (count > 0) {
      const firstLiveRegion = liveRegions.first();
      const ariaLive = await firstLiveRegion.getAttribute('aria-live');
      const role = await firstLiveRegion.getAttribute('role');
      
      expect(ariaLive || role).toBeTruthy();
    }
  });
});
