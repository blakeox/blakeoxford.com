import { test, expect } from '../fixtures';
import { waitForKeyboardResponse } from '../utils/test-helpers';

test.describe('WCAG Compliance Tests', () => {
  test('homepage should pass all accessibility audits', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for proper document structure
    const docTitle = await page.title();
    expect(docTitle.length).toBeGreaterThan(5);
    expect(docTitle.length).toBeLessThan(60);
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible();
    
    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Verify nav has accessible name
    const navLabel = await nav.getAttribute('aria-label');
    const navHeading = nav.locator('h1, h2, h3, h4, h5, h6').first();
    expect(navLabel || await navHeading.textContent()).toBeTruthy();
  });

  test('all main pages should have proper document structure', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded'); // Changed from 'networkidle' to be less strict
      
      // Check language attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang?.length).toBeGreaterThan(1);
      
      // Check viewport meta tag
      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toHaveCount(1);
      
      // Check page has meaningful title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(3);
      
  // Check skip link exists and becomes visible on focus
  const skipLink = page.locator('a[href="#main"], a[href="#main-content"]').first();
  await expect(skipLink).toHaveCount(1);
  await skipLink.focus();
  // Allow a moment for :focus styles to apply across engines
  await waitForKeyboardResponse(page);
  await expect(skipLink).toBeVisible();
    }
  });
});
