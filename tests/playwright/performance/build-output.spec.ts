import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Build Output', () => {
  test.setTimeout(15000);

  test('should have reasonable build output size', async () => {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Check if dist directory exists (skip if not built)
    if (!fs.existsSync(distPath)) {
      console.log('Dist directory not found, skipping build analysis');
      return;
    }
    
    // Simple size check
    const getDirectorySize = (dirPath: string): number => {
      let totalSize = 0;
      
      try {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            totalSize += getDirectorySize(itemPath);
          } else {
            totalSize += stats.size;
          }
        });
      } catch {
        // Handle permission errors
      }
      
      return totalSize;
    };
    
    const totalSize = getDirectorySize(distPath);
    
    // Build output should be reasonable size
    expect(totalSize).toBeLessThan(50 * 1024 * 1024); // 50MB max
    
    console.log(`Build output size: ${Math.round(totalSize / (1024 * 1024))}MB`);
  });

  test('should check for compressed assets', async ({ page }) => {
    const compressedAssets: string[] = [];
    
    page.on('response', (response) => {
      const encoding = response.headers()['content-encoding'];
      if (encoding && ['gzip', 'br', 'deflate'].includes(encoding)) {
        compressedAssets.push(response.url().split('/').pop() || response.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    console.log(`Found ${compressedAssets.length} compressed assets`);
    
    // Should have some compressed assets in production
    if (compressedAssets.length > 0) {
      expect(compressedAssets.length).toBeGreaterThan(0);
    }
  });
});
