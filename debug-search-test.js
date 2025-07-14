const { test, expect } = require('@playwright/test');

test('debug search overlay', async ({ page }) => {
  await page.goto('http://localhost:4323/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check if SearchOverlay exists
  const hasSearchOverlay = await page.evaluate(() => {
    return {
      elementExists: !!document.getElementById('search-overlay'),
      windowSearchOverlay: !!window.searchOverlay,
      SearchOverlayClass: typeof SearchOverlay !== 'undefined',
      interactiveBundle: !!document.querySelector('script[src*="interactive"]'),
      errors: window.errorLog || []
    };
  });
  
  console.log('Search overlay debug info:', hasSearchOverlay);
  
  // Try to manually trigger the search overlay
  const triggerResult = await page.evaluate(() => {
    // Add error logging
    window.errorLog = [];
    window.addEventListener('error', (e) => {
      window.errorLog.push(e.message);
    });
    
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
      console.log('Found overlay element');
      
      // Try to manually add active class
      overlay.classList.add('active');
      
      return {
        hasActiveClass: overlay.classList.contains('active'),
        computedStyle: {
          opacity: getComputedStyle(overlay).opacity,
          visibility: getComputedStyle(overlay).visibility,
          display: getComputedStyle(overlay).display
        }
      };
    }
    return { error: 'Overlay not found' };
  });
  
  console.log('Manual trigger result:', triggerResult);
  
  // Check if overlay is now visible
  const searchOverlay = page.locator('#search-overlay');
  const isVisible = await searchOverlay.isVisible();
  console.log('Is overlay visible after manual trigger:', isVisible);
});
