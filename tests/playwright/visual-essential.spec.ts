import { test, expect } from '@playwright/test';

test.describe('Essential Visual Tests', () => {
  // Only test critical visual elements, not full page screenshots
  test('homepage key components should be visually stable @essential', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test specific components instead of full page
    const navigation = page.locator('nav#navbar');
    await expect(navigation).toBeVisible();
    
    const hero = page.locator('main h1').first();
    await expect(hero).toBeVisible();
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Quick visual check - ensure no layout shift
    const heroBox = await hero.boundingBox();
    expect(heroBox).toBeTruthy();
    expect(heroBox!.width).toBeGreaterThan(100);
    expect(heroBox!.height).toBeGreaterThan(20);
  });

  test('mobile layout should be stable @essential', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check mobile navigation
    const burgerButton = page.locator('#nav-toggle');
    await expect(burgerButton).toBeVisible();
    
    // Check content is properly responsive
    const main = page.locator('main');
    const mainBox = await main.boundingBox();
    expect(mainBox).toBeTruthy();
    expect(mainBox!.width).toBeLessThanOrEqual(375); // Should fit in viewport
  });

  test('theme switching should maintain layout @smoke', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Get initial layout
    const hero = page.locator('main h1').first();
    const initialBox = await hero.boundingBox();
    
    // Toggle theme if available
    const themeToggle = page.locator('#theme-toggle');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300); // Wait for theme transition
      
      // Check layout didn't shift significantly
      const afterBox = await hero.boundingBox();
      expect(afterBox).toBeTruthy();
      
      if (initialBox && afterBox) {
        // Allow small differences but no major layout shifts
        expect(Math.abs(afterBox.y - initialBox.y)).toBeLessThan(50);
        expect(Math.abs(afterBox.width - initialBox.width)).toBeLessThan(50);
      }
    }
  });
});
