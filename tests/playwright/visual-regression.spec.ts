import { test, expect } from '@playwright/test';
import { disableAnimationsComprehensive, waitForStability } from './utils/test-helpers';

test.describe('Visual Regression Testing', () => {
  // Configure for consistent screenshots
  test.beforeEach(async ({ page }) => {
    // Disable animations comprehensively for consistent screenshots
    await disableAnimationsComprehensive(page);
  });

  test.describe('Page-Level Visual Testing', () => {
    test('homepage should match visual baseline', async ({ page }) => {
      await page.goto('/');
      await waitForStability(page);
      
      // Take full page screenshot with dynamic content masking
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        threshold: 0.3, // Allow 30% difference for fonts/rendering variations
        maxDiffPixels: 400000, // Increased for CI environment differences
        mask: [
          page.locator('.dynamic-timestamp, [data-dynamic="true"]'),
          page.locator('time'), // Mask any timestamps
          page.locator('.coin-flip'), // Mask interactive coin flip elements
        ]
      });
    });

    test('about page should match visual baseline', async ({ page }) => {
      await page.goto('/about');
      await waitForStability(page);
      
      await expect(page).toHaveScreenshot('about-page.png', {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 400000,
        mask: [
          page.locator('.photo-carousel'), // Mask carousel that might have dynamic content
          page.locator('.coin-flip'), // Mask coin flip elements
        ]
      });
    });

    test('projects page should maintain layout consistency', async ({ page }) => {
      await page.goto('/projects');
      await waitForStability(page);
      
      await expect(page).toHaveScreenshot('projects-page.png', {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 400000,
      });
    });

    test('contact page should match visual baseline', async ({ page }) => {
      await page.goto('/contact');
      await waitForStability(page);
      
      // Wait for form to be visible and stable
      await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
      
      await expect(page).toHaveScreenshot('contact-page.png', {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 400000,
        // Mask any potentially dynamic elements
        mask: [
          page.locator('.error-overlay'),
          page.locator('[class*="error"]'),
          page.locator('[id*="error"]'),
          page.locator('.coin-flip'), // Mask coin flip elements
          page.locator('[name="cf-turnstile-response"]'), // Mask Cloudflare Turnstile
        ]
      });
    });
  });

  test.describe('Component-Level Visual Testing', () => {
    test('navigation components should be visually consistent', async ({ page }) => {
      // Set consistent viewport to avoid size differences
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      
      // Wait for fonts and content to load fully
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => document.fonts.ready);
      
      // Wait for navigation to be stable
      const nav = page.locator('nav').first();
      await nav.waitFor({ state: 'visible' });
      
      // Take screenshot with consistent settings
      await expect(nav).toHaveScreenshot('navigation-desktop.png', {
        threshold: 0.05, // Allow 5% difference for cross-browser variations
        animations: 'disabled'
      });
    });

    test('mobile navigation should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Wait for fonts and content to load fully  
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => document.fonts.ready);
      
      const nav = page.locator('nav').first();
      await nav.waitFor({ state: 'visible' });
      
      await expect(nav).toHaveScreenshot('navigation-mobile.png', {
        threshold: 0.05, // Allow 5% difference for cross-browser variations
        animations: 'disabled'
      });
    });

    test('project cards should maintain consistent styling', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCard = page.locator('article, .project-card, a[href*="/projects/"]').first();
      if (await projectCard.isVisible()) {
        await expect(projectCard).toHaveScreenshot('project-card.png', {
          threshold: 0.3, // Allow slightly more variation for dynamic content
        });
      }
    });

    test('footer should be visually consistent', async ({ page }) => {
      await page.goto('/');
      
      // Select the main page footer specifically
      const footer = page.locator('footer').first(); 
      if (await footer.isVisible()) {
        await expect(footer).toHaveScreenshot('footer.png');
      }
    });

    test('search overlay should match design', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for search to initialize
      
      // Open search overlay
      await page.keyboard.press('Control+k');
      const searchOverlay = page.locator('#search-overlay');
      
      if (await searchOverlay.isVisible()) {
        await expect(searchOverlay).toHaveScreenshot('search-overlay.png');
      }
    });
  });

  test.describe('State-Based Visual Testing', () => {
    test('theme toggle should work visually', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Light theme screenshot
      await expect(page.locator('header, nav').first()).toHaveScreenshot('theme-light.png');
      
      // Toggle to dark theme if theme toggle exists
      const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Dark theme screenshot
        await expect(page.locator('header, nav').first()).toHaveScreenshot('theme-dark.png');
      }
    });

    test('form states should be visually consistent', async ({ page }) => {
      await page.goto('/contact');
      
      const form = page.locator('#contact-form, form').first();
      
      // Empty form state
      await expect(form).toHaveScreenshot('form-empty.png');
      
      // Filled form state
      await page.locator('#name').fill('Test User');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#message').fill('This is a test message');
      
      await expect(form).toHaveScreenshot('form-filled.png');
      
      // Focus state
      await page.locator('#name').focus();
      await expect(form).toHaveScreenshot('form-focused.png');
    });

    test('mobile menu states should be consistent', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Closed mobile menu state
      const mobileMenu = page.locator('nav, .mobile-menu').first();
      await expect(mobileMenu).toHaveScreenshot('mobile-menu-closed.png');
      
      // Try to open mobile menu if hamburger exists
      const hamburgerButton = page.locator('button[aria-label*="menu"], .hamburger, [data-mobile-menu-toggle]');
      if (await hamburgerButton.isVisible()) {
        await hamburgerButton.click();
        await page.waitForTimeout(300);
        
        // Open mobile menu state
        await expect(mobileMenu).toHaveScreenshot('mobile-menu-open.png');
      }
    });
  });

  test.describe('Responsive Visual Testing', () => {
    test('responsive breakpoints should be consistent', async ({ page }) => {
      const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1024, height: 768 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.goto('/');
        
        // Wait for content and fonts to stabilize
        await page.waitForLoadState('domcontentloaded');
        await page.waitForFunction(() => document.fonts.ready);
        await page.waitForTimeout(500); // Brief wait for layout stabilization
        
        // Screenshot main content area for each breakpoint
        await expect(page.locator('main').first()).toHaveScreenshot(`homepage-${breakpoint.name}.png`, {
          threshold: 0.2, // Reasonable threshold for responsive layouts
          animations: 'disabled'
        });
      }
    });

    test('navigation should adapt to different screen sizes', async ({ page }) => {
      const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1200, height: 800 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        const nav = page.locator('nav').first();
        await expect(nav).toHaveScreenshot(`navigation-${breakpoint.name}.png`);
      }
    });
  });

  test.describe('Error State Visual Testing', () => {
    test('404 page should match design', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'domcontentloaded' });
      
      // Wait for 404 content to load
      await page.waitForTimeout(1000);
      
      await expect(page.locator('main').first()).toHaveScreenshot('404-page.png', {
        threshold: 0.2,
      });
    });

    test('empty search results should be consistent', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Open search and enter query that won't match anything
      await page.keyboard.press('Control+k');
      const searchOverlay = page.locator('#search-overlay');
      
      if (await searchOverlay.isVisible()) {
        const searchInput = page.locator('#search-input');
        await searchInput.fill('xyznonexistentquery123');
        await page.waitForTimeout(500);
        
        const searchResults = page.locator('#search-results');
        if (await searchResults.isVisible()) {
          await expect(searchResults).toHaveScreenshot('search-no-results.png');
        }
      }
    });
  });
});
