 
import { test, expect } from '@playwright/test';

test('debug search overlay manually', async ({ page }) => {
  console.log('Starting search debug test...');
  
  await page.goto('http://localhost:4323/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
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
  
  // Try to force the overlay to be visible
  await page.evaluate(() => {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      overlay.style.display = 'flex';
      overlay.classList.add('active');
    }
  });
  
  const isVisibleAfterForce = await page.locator('#search-overlay').isVisible();
  console.log('Is visible after forcing styles:', isVisibleAfterForce);
  
  expect(isVisibleAfterForce).toBe(true);
});
