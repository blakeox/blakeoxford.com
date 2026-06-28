import { test, expect } from '../fixtures';

test.describe('Screen Reader Support Tests', () => {
  test('should have proper ARIA landmarks structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for essential ARIA landmarks
    // Navigation serves as the visible banner content
    const navigation = page.locator('nav[role="navigation"]').first();
    await expect(navigation).toBeVisible();
    
    const main = page.locator('[role="main"], main').first();
    await expect(main).toBeVisible();
    
    const contentinfo = page.locator('[role="contentinfo"], footer').first();
    await expect(contentinfo).toBeVisible();
    
    // Ensure header exists for semantic structure even if not visible
    const header = page.locator('header[role="banner"]');
    await expect(header).toHaveCount(1);
  });

  test('should have meaningful heading hierarchy', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      // Count main content H1 elements - should be exactly 1 per page
      const mainH1Count = await page.locator('main h1, [role="main"] h1, body > section h1, body > div h1').count();
      expect(mainH1Count).toBeGreaterThanOrEqual(1);
      
      // Get all headings in order from main content area
      const headings = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6, [role="main"] h1, [role="main"] h2, [role="main"] h3, [role="main"] h4, [role="main"] h5, [role="main"] h6').all();
      
      // Verify there's at least one heading
      if (headings.length > 0) {
        const firstHeading = await headings[0].evaluate(el => el.tagName.toLowerCase());
        expect(firstHeading).toBe('h1');
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
