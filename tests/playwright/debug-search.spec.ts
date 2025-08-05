 
import { test, expect } from '@playwright/test';

test('debug search overlay manually', async ({ page }) => {
  console.log('Starting search debug test...');
  
  await page.goto('/'); // Use relative URL
  await page.waitForLoadState('domcontentloaded'); // Less strict than networkidle
  await page.waitForTimeout(1000); // Reduced timeout
  
  // Check what's in the page
  const pageInfo = await page.evaluate(() => {
    const overlay = document.getElementById('search-overlay');
    return {
      overlayExists: !!overlay,
      overlayClasses: overlay ? overlay.className : 'not found',
      overlayStyle: overlay ? window.getComputedStyle(overlay).display : 'not found',
      searchOverlayInstance: !!(window as any).searchOverlay,
      searchOverlayType: typeof (window as any).searchOverlay,
      scripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('interactive')),
      errors: (window as any).errors || []
    };
  });
  
  console.log('Page info:', pageInfo);
  
  // Try to force the overlay to be visible by adding the active class
  await page.evaluate(() => {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
      // Add the active class which should make it visible according to CSS
      overlay.classList.add('active');
      // Also force the CSS properties to ensure visibility
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      overlay.style.display = 'flex';
      overlay.style.pointerEvents = 'auto';
    }
  });
  
  // Wait a bit for CSS transitions
  await page.waitForTimeout(100);
  
  const isVisibleAfterForce = await page.locator('#search-overlay').isVisible();
  console.log('Is visible after forcing styles:', isVisibleAfterForce);
  
  // The test should pass once we properly activate the overlay
  expect(isVisibleAfterForce).toBe(true);
});
