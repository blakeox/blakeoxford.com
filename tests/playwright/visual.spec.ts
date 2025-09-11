// tests/playwright/visual.spec.ts
import { test, expect, Page } from '@playwright/test';
import { 
  navigateWithRetry, 
  waitForImagesWithFallback, 
  disableAnimationsComprehensive, 
  waitForStability 
} from './utils/test-helpers';
// DEPRECATED: Replaced by visual-routes.spec.ts consolidated coverage.
test.describe.skip('Deprecated visual.spec.ts', () => {

async function disableAnimations(page: Page): Promise<void> {
  try {
    // Use comprehensive animation disabling
    await disableAnimationsComprehensive(page);
  } catch (error) {
    console.warn('Animation disabling failed:', error);
    // Continue with test - don't fail here
  }
}

// Temporary flag: full-page visual comparisons are flaky due to dynamic image loading height variance.
// We skip these for now; essential visual checks live in visual-essential.spec.ts.
// TODO: Implement stable sectional screenshots or deterministic image loading, then re-enable.
const ENABLE_FULL_PAGE_VISUAL = false;

const pages = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'Projects', path: '/projects' },
  { name: 'Contact', path: '/contact' },
];

for (const page of pages) {
  const testFn = ENABLE_FULL_PAGE_VISUAL ? test : test.skip;
  testFn(`Visual regression test for ${page.name} page`, async ({ page: playwrightPage }) => {
    try {
      // Use robust navigation with increased timeout
      await navigateWithRetry(playwrightPage, page.path, { 
        timeout: 45000, // Increased timeout for CI
        maxRetries: 3 
      });
      
      // Wait for page stability
      await waitForStability(playwrightPage);
      
      // Wait for images to load with fallback
      await waitForImagesWithFallback(playwrightPage);
      
      // Disable all animations with comprehensive approach
      await disableAnimations(playwrightPage);
      
      // Final stability wait after animations are disabled
      await playwrightPage.waitForTimeout(2000);
      
      // Take screenshot with increased tolerance for CI environment differences
      await expect(playwrightPage).toHaveScreenshot({ 
        fullPage: true, 
        maxDiffPixels: 600000, // Further increased tolerance for CI/cross-platform differences
        threshold: 0.4, // 40% threshold for rendering differences in CI
        animations: 'disabled',
        // Mask potentially unstable elements
        mask: [
          playwrightPage.locator('.coin-flip'),
          playwrightPage.locator('.photo-carousel'),
          playwrightPage.locator('[data-dynamic="true"]'),
        ]
      });
      
    } catch (error) {
      console.error(`Visual regression test failed for ${page.name}:`, error);
      
      // Take a debug screenshot on failure
      try {
        const timestamp = Date.now();
        await playwrightPage.screenshot({ 
          path: `test-results/debug-${page.name.toLowerCase()}-${timestamp}.png`,
          fullPage: true 
        });
        
        // Also capture viewport info
        const viewport = await playwrightPage.viewportSize();
        console.log(`Debug info for ${page.name}: viewport=${JSON.stringify(viewport)}`);
        
      } catch (screenshotError) {
        console.warn('Could not take debug screenshot:', screenshotError);
      }
      
      // Re-throw the original error
      throw error;
    }
  });
}
});
