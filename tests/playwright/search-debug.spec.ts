import { test } from '@playwright/test';

// Extend window typing for test-only globals
declare global {
  interface Window {
    searchOverlay?: unknown;
    TestSearchOverlay?: any;
    testSearchInstance?: any;
  }
}

test.describe('SearchOverlay Debug', () => {
  test('should debug SearchOverlay loading with manual script', async ({ page }) => {
    // Inject our debug script (test-only asset)
    await page.addInitScript({ path: './tests/assets/search-debug-manual.js' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Debugging SearchOverlay with manual script...');
    
    // Wait for the debug script to complete
    await page.waitForTimeout(3000);
    
    // Check the result
    const result = await page.evaluate(() => {
      return {
        originalSearchOverlay: typeof window.searchOverlay,
        testSearchOverlay: typeof window.TestSearchOverlay,
        testInstance: typeof window.testSearchInstance,
        searchOverlayGlobal: typeof (window as any).SearchOverlay,
        canOpenTest: typeof window.testSearchInstance?.open === 'function'
      };
    });
    
    console.log('Debug Result:', result);
    
    // Try to open the test overlay
    if (result.canOpenTest) {
      await page.evaluate(() => {
        window.testSearchInstance!.open();
      });
      
      await page.waitForTimeout(500);
      
      const overlayTest = await page.evaluate(() => {
        const overlay = document.getElementById('search-overlay');
        return {
          exists: !!overlay,
          hasActiveClass: overlay?.classList.contains('active'),
          opacity: overlay ? window.getComputedStyle(overlay).opacity : null
        };
      });
      
      console.log('Overlay Test Result:', overlayTest);
      
      // If the test worked, try Control+K
      if (overlayTest.hasActiveClass) {
        // Close first
        await page.evaluate(() => {
          const overlay = document.getElementById('search-overlay');
          overlay?.classList.remove('active');
        });
        
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500);
        
        const keyboardTest = await page.evaluate(() => {
          const overlay = document.getElementById('search-overlay');
          return {
            hasActiveClass: overlay?.classList.contains('active'),
            opacity: overlay ? window.getComputedStyle(overlay).opacity : null
          };
        });
        
        console.log('Keyboard Test Result:', keyboardTest);
      }
    }
  });
});
