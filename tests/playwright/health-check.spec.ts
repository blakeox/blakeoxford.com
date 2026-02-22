import { test, expect } from '@playwright/test';
import { waitForAsyncOperation } from './utils/test-helpers';

test.describe('Server Health Check', () => {
  test('server should be accessible and return homepage', async ({ page }) => {
    let response;
    let retries = 3;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        response = await page.goto('/', { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 // Increased timeout
        });
        
        // Check if we got a response
        if (response && response.status() === 200) {
          break;
        } else {
          console.warn(`Attempt ${attempt}: Got status ${response?.status()}`);
        }
        
      } catch (error) {
        console.error(`Homepage navigation attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          throw new Error(`Could not navigate to homepage after ${retries} attempts`, { cause: error });
        }
        
        // Wait before retry
        await waitForAsyncOperation(page);
      }
    }
    
    expect(response?.status()).toBe(200);
    
    // Verify basic page structure is loaded
    try {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      
      // Check for body element
      const body = await page.locator('body').first();
      await expect(body).toBeVisible();
    } catch (error) {
      console.error('Page structure verification failed:', error);
      throw error;
    }
  });

  test('all main pages should be accessible', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];
    const failures: Array<{ path: string; status?: number; error?: string }> = [];
    
    for (const pagePath of pages) {
      console.log(`Checking ${pagePath}...`);
      
      let attempts = 2;
      let success = false;
      
      for (let attempt = 1; attempt <= attempts && !success; attempt++) {
        try {
          const response = await page.goto(pagePath, { 
            waitUntil: 'domcontentloaded',
            timeout: 45000 // Increased timeout
          });
          
          const status = response?.status();
          
          if (status !== 200) {
            failures.push({ 
              path: pagePath, 
              status, 
              error: `Expected 200, got ${status}` 
            });
          } else {
            success = true;
            console.log(`✅ ${pagePath}: ${status}`);
          }
          
        } catch (error) {
          console.warn(`Attempt ${attempt}/${attempts} failed for ${pagePath}:`, error);
          
          if (attempt === attempts) {
            failures.push({ 
              path: pagePath, 
              error: `Navigation failed: ${error}` 
            });
          } else {
            // Wait before retry
            await waitForAsyncOperation(page);
          }
        }
      }
    }
    
    // Report all failures at once
    if (failures.length > 0) {
      const failureDetails = failures.map(f => 
        `${f.path}: ${f.error || `status ${f.status}`}`
      ).join('\n');
      
      throw new Error(`Page accessibility failures:\n${failureDetails}`);
    }
  });
});
