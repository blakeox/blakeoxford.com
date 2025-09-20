import { test } from '@playwright/test';

test('debug carousel breakpoint behavior', async ({ page }) => {
  // Test at different viewport sizes to see the transition
  const viewports = [
    { width: 768, height: 900, name: 'tablet' },
    { width: 1023, height: 900, name: 'just-below-lg' },
    { width: 1024, height: 900, name: 'exactly-lg' },
    { width: 1280, height: 900, name: 'desktop' },
    { width: 1920, height: 1080, name: 'large-desktop' }
  ];

  for (const viewport of viewports) {
    console.log(`\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('http://localhost:4321/about');
    
    // Wait for the carousel to load
    await page.waitForSelector('[role="region"][aria-label*="Photo carousel"]', { timeout: 10000 });
    
    const debugInfo = await page.evaluate(() => {
      const horizontal = document.querySelector('ul.animate-carousel-x-slow');
      const upCol = document.querySelector('ul.animate-carousel-up-slow');
      const downCol = document.querySelector('ul.animate-carousel-down-slow');
      const horizontalParent = horizontal?.parentElement;
      const verticalParent = upCol?.parentElement;
      
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        lgMediaQuery: window.matchMedia('(min-width: 1024px)').matches,
        horizontal: {
          exists: !!horizontal,
          display: horizontal ? getComputedStyle(horizontal).display : 'not-found',
          visibility: horizontal ? getComputedStyle(horizontal).visibility : 'not-found',
          parentDisplay: horizontalParent ? getComputedStyle(horizontalParent).display : 'no-parent',
          parentClasses: horizontalParent?.className || 'no-parent'
        },
        vertical: {
          upExists: !!upCol,
          downExists: !!downCol,
          upDisplay: upCol ? getComputedStyle(upCol).display : 'not-found',
          downDisplay: downCol ? getComputedStyle(downCol).display : 'not-found',
          parentDisplay: verticalParent ? getComputedStyle(verticalParent).display : 'no-parent',
          parentClasses: verticalParent?.className || 'no-parent'
        }
      };
    });
    
    console.log(JSON.stringify(debugInfo, null, 2));
    
    // Take screenshots for each size
    await page.screenshot({ 
      path: `carousel-debug-${viewport.name}.png`,
      fullPage: false
    });
  }
});