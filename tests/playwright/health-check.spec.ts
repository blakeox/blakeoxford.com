import { test, expect } from '@playwright/test';

test.describe('Server Health Check', () => {
  test('server should be accessible and return homepage', async ({ page }) => {
    const response = await page.goto('/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    expect(response?.status()).toBe(200);
    
    // Verify basic page structure is loaded
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check for body element
    const body = await page.locator('body').first();
    await expect(body).toBeVisible();
  });

  test('all main pages should be accessible', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    
    for (const pagePath of pages) {
      console.log(`Checking ${pagePath}...`);
      const response = await page.goto(pagePath, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      expect(response?.status()).toBe(200);
      
      // Basic content check
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(100);
    }
  });
});
