// Test helper utilities for robust Playwright testing

import { Page } from '@playwright/test';
import { ensureImagesReady } from './image-helpers';

/**
 * Wait for form validation messages to appear after form submission
 */
export async function waitForFormValidation(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(() => {
    const errorElements = document.querySelectorAll('[role="alert"], .error, [aria-invalid="true"], .invalid-feedback');
    return errorElements.length > 0 || document.querySelector('input[aria-invalid="true"], textarea[aria-invalid="true"]');
  }, { timeout });
}

/**
 * Wait for search results to appear
 */
export async function waitForSearchResults(page: Page, timeout = 3000): Promise<void> {
  await page.waitForFunction(() => {
    const results = document.querySelectorAll('[data-search-result], .search-result, .search-results li, .search-overlay [role="listbox"] [role="option"]');
    return results.length > 0;
  }, { timeout });
}

/**
 * Wait for keyboard event handling (debounced inputs, etc.)
 */
export async function waitForKeyboardResponse(page: Page, timeout = 1000): Promise<void> {
  await page.waitForTimeout(Math.min(timeout, 500)); // Use short timeout for immediate responses
}

/**
 * Wait for async operations like setTimeout callbacks
 */
export async function waitForAsyncOperation(page: Page, timeout = 1500): Promise<void> {
  await page.waitForTimeout(Math.min(timeout, 1000)); // Reasonable timeout for async ops
}

/**
 * Wait for images to load with error handling
 */
export async function waitForImagesWithFallback(page: Page, timeout = 10000): Promise<void> {
  await ensureImagesReady(page, timeout);
}

/**
 * Robust navigation with retries and error handling
 */
export async function navigateWithRetry(
  page: Page, 
  url: string, 
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<void> {
  const { maxRetries = 3, timeout = 30000 } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout 
      });
      
      // Wait for basic page structure
      await page.waitForSelector('body', { timeout: 5000 });
      return; // Success
      
    } catch (error) {
      console.warn(`Navigation attempt ${attempt}/${maxRetries} failed for ${url}:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry
      await page.waitForTimeout(1000 * attempt);
    }
  }
}

/**
 * Check if element exists with timeout
 */
export async function elementExists(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get element with fallback selectors
 */
export async function getElementWithFallback(page: Page, selectors: string[]): Promise<import('@playwright/test').Locator | null> {
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.count() > 0) {
      return element;
    }
  }
  return null;
}

/**
 * Disable animations comprehensively
 */
export async function disableAnimationsComprehensive(page: Page): Promise<void> {
  try {
    // CSS approach with comprehensive coverage
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transform-origin: center !important;
          animation-play-state: paused !important;
        }
        
        /* Disable specific component animations */
        .coin-flip-inner,
        .coin-flip-inner.coin-flip-multi,
        .carousel-container *,
        .photo-carousel *,
        [data-lazy],
        .lazy-load,
        .animate-fadeIn,
        .animate-fadeInUp,
        .animate-slide-up,
        .animate-float,
        .animate-pulse {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
        
        /* Disable hover/focus animations */
        *:hover, *:focus, *:active {
          transition: none !important;
          animation: none !important;
        }
        
        /* Disable auto-playing animations */
        @keyframes fadeIn { 
          to { opacity: 1; }
        }
        @keyframes fadeInUp { 
          to { opacity: 1; transform: none; }
        }
        @keyframes float { 
          to { transform: none; }
        }
        
        /* Force reduced motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `
    });
    
    // JavaScript approach with error handling
    await page.evaluate(() => {
      try {
        // Override animation functions
        if (typeof window !== 'undefined') {
          // Mock requestAnimationFrame for immediate execution
          window.requestAnimationFrame = (callback) => {
            return window.setTimeout(() => {
              try {
                callback(Date.now());
              } catch (e) {
                console.warn('RAF callback error:', e);
              }
            }, 0);
          };
          
          // Mock cancelAnimationFrame
          window.cancelAnimationFrame = (id) => {
            window.clearTimeout(id);
          };
          
          // Set reduced motion preference
          if ('matchMedia' in window) {
            Object.defineProperty(window, 'matchMedia', {
              value: (query) => {
                if (query.includes('prefers-reduced-motion')) {
                  return { 
                    matches: true, 
                    media: query,
                    addEventListener: () => {},
                    removeEventListener: () => {},
                    dispatchEvent: () => true
                  };
                }
                return { 
                  matches: false, 
                  media: query,
                  addEventListener: () => {},
                  removeEventListener: () => {},
                  dispatchEvent: () => true
                };
              }
            });
          }
          
          // Disable CSS animations via style
          document.documentElement.style.setProperty('--animation-duration', '0s');
          document.documentElement.style.setProperty('--transition-duration', '0s');
          
          // Add body class for CSS targeting
          if (document.body) {
            document.body.classList.add('animations-disabled', 'reduced-motion');
          }
        }
      } catch (e) {
        console.warn('JavaScript animation disabling failed:', e);
      }
    });
    
    // Wait for changes to take effect
    await page.waitForTimeout(100);
    
  } catch (error) {
    console.warn('Animation disabling failed:', error);
    // Don't throw - continue with tests
  }
}

/**
 * Wait for page stability (no layout shifts)
 */
export async function waitForStability(page: Page, timeout = 5000): Promise<void> {
  try {
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready.catch(() => {}));
    
    // Wait for any pending network requests
    await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 10000) });
    
    // Additional stability wait
    await page.waitForTimeout(1000);
    
  } catch (error) {
    console.warn('Stability wait failed:', error);
    // Continue anyway
  }
}
