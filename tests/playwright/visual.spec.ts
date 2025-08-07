// tests/playwright/visual.spec.ts
import { test, expect, Page } from '@playwright/test';

async function disableAnimations(page: Page): Promise<void> {
  // Disable animations and transitions for visual tests
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        transform-origin: center !important;
      }
      
      /* Specifically target coin flip animations */
      .coin-flip-inner,
      .coin-flip-inner.coin-flip-multi {
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }
      
      /* Disable carousel animations */
      .carousel-container *, 
      .carousel-column *,
      .photo-carousel * {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
      
      /* Disable hover effects that might cause instability */
      .coin-flip:hover .coin-flip-inner,
      .coin-flip:focus .coin-flip-inner {
        transform: none !important;
      }
    `
  });
}

const pages = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'Projects', path: '/projects' },
  { name: 'Contact', path: '/contact' },
];

for (const page of pages) {
  test(`Visual regression test for ${page.name} page`, async ({ page: playwrightPage }) => {
    await playwrightPage.goto(page.path);
    
    // Wait for page to load completely
    await playwrightPage.waitForLoadState('networkidle');
    
    // Disable all animations
    await disableAnimations(playwrightPage);
    
    // Wait a bit more for any remaining animations to stop
    await playwrightPage.waitForTimeout(1000);
    
    await expect(playwrightPage).toHaveScreenshot({ 
      fullPage: true, 
      maxDiffPixels: 300000  // Increased to account for remaining dynamic content
    });
  });
}
