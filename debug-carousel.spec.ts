import { test, expect } from '@playwright/test';

test('debug desktop carousel visual check', async ({ page }) => {
  // Set to desktop size
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:4324/about');
  
  // Wait for the carousel to load
  await page.waitForSelector('[role="region"][aria-label*="Photo carousel"]');
  
  // Take a screenshot
  await page.screenshot({ 
    path: 'carousel-desktop-debug.png',
    fullPage: false
  });
  
  // Debug the state
  const debugInfo = await page.evaluate(() => {
    const horizontal = document.querySelector('ul.animate-carousel-x-slow');
    const upCol = document.querySelector('ul.animate-carousel-up-slow');
    const downCol = document.querySelector('ul.animate-carousel-down-slow');
    
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      lgMediaQuery: window.matchMedia('(min-width: 1024px)').matches,
      horizontal: horizontal ? {
        exists: true,
        display: getComputedStyle(horizontal).display,
        visibility: getComputedStyle(horizontal).visibility,
        parentDisplay: getComputedStyle(horizontal.parentElement).display,
        parentClasses: horizontal.parentElement.className
      } : { exists: false },
      upCol: upCol ? {
        exists: true,
        display: getComputedStyle(upCol).display,
        visibility: getComputedStyle(upCol).visibility,
        parentDisplay: getComputedStyle(upCol.parentElement).display,
        parentClasses: upCol.parentElement.className
      } : { exists: false },
      downCol: downCol ? {
        exists: true,
        display: getComputedStyle(downCol).display,
        visibility: getComputedStyle(downCol).visibility
      } : { exists: false }
    };
  });
  
  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
  
  // Basic assertions
  expect(debugInfo.lgMediaQuery).toBe(true);
  expect(debugInfo.horizontal.exists).toBe(true);
  expect(debugInfo.upCol.exists).toBe(true);
  expect(debugInfo.downCol.exists).toBe(true);
});