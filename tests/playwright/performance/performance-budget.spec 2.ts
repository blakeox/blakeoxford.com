import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const budgetsPath = path.join(process.cwd(), 'tests/config/performance-budgets.json');
const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf-8'));

test.describe('Performance Budget', () => {
  // Shorter timeout for CI
  test.setTimeout(20000);

  test('should meet basic performance thresholds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Simple performance check
    const performanceMetrics = await page.evaluate(() => {
      const metrics: Record<string, number> = {};
      
      // Basic timing measurement
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0] as any;
        metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
      }
      
      // First Contentful Paint
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
        }
      });
      
      return metrics;
    });
    
    console.log('Performance Metrics:', performanceMetrics);
    
    // Basic thresholds
    if (performanceMetrics.domContentLoaded) {
      expect(performanceMetrics.domContentLoaded).toBeLessThan(budgets.timings.domContentLoaded);
    }
    if (performanceMetrics.fcp) {
      expect(performanceMetrics.fcp).toBeLessThan(budgets.timings.fcp);
    }
  });

  test('should maintain reasonable page load times', async ({ page }) => {
    const pages = ['/', '/about', '/projects'];
    const loadTimes: Array<{ page: string; loadTime: number }> = [];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      loadTimes.push({ page: pagePath, loadTime });
      
      // Each page should load within reasonable time
  expect(loadTime).toBeLessThan(budgets.pageLoad.default);
    }
    
    console.log('Page Load Times:', loadTimes.map(p => `${p.page}: ${p.loadTime}ms`));
  });

  test('should have reasonable resource counts', async ({ page }) => {
    const resourceCounts = {
      total: 0,
      js: 0,
      css: 0,
      images: 0
    };
    
    // Track key resources only
    page.on('response', (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      resourceCounts.total++;
      
      if (contentType.includes('javascript') || url.includes('.js')) {
        resourceCounts.js++;
      } else if (contentType.includes('css') || url.includes('.css')) {
        resourceCounts.css++;
      } else if (contentType.startsWith('image/')) {
        resourceCounts.images++;
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Resource count budgets (relaxed for CI)
  expect(resourceCounts.total).toBeLessThan(budgets.resources.total);
  expect(resourceCounts.js).toBeLessThan(budgets.resources.js);
  expect(resourceCounts.css).toBeLessThan(budgets.resources.css);
    
    console.log('Resource Counts:', resourceCounts);
  });
});
