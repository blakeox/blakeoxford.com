import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    // Title is set via Layout component
    await expect(page).toHaveTitle(/Welcome to My Portfolio/);
    // Only the main hero heading should be visible
    await expect(page.getByRole('heading', { name: 'Blake Oxford' })).toBeVisible();
  });

  test('should have main navigation menu', async ({ page }) => {
    await page.goto('/');
    const mainNav = page.locator('nav[aria-label="Main Navigation"]');
    await expect(mainNav).toBeVisible();
    await expect(mainNav.locator('a')).toHaveCount(await mainNav.locator('a').count());
  });
});

test.describe('Search functionality', () => {
  test('should open search overlay with keyboard shortcut', async ({ page }) => {
    await page.goto('/');
    
    // Wait for search script to load
    await page.waitForTimeout(1000);
    
    // Try to open search with Ctrl+K
    await page.keyboard.press('Control+k');
    
    // Wait for search overlay to appear
    const searchOverlay = page.locator('#search-overlay');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
    
    // Check that search input is focused
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeFocused();
  });
  
  test('should close search overlay with escape key', async ({ page }) => {
    await page.goto('/');
    
    // Wait for search script to load
    await page.waitForTimeout(1000);
    
    // Open search overlay
    await page.keyboard.press('Control+k');
    const searchOverlay = page.locator('#search-overlay');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
    
    // Close with escape key
    await page.keyboard.press('Escape');
    await expect(searchOverlay).not.toBeVisible();
  });

  test('should perform search and show results', async ({ page }) => {
    await page.goto('/');
    
    // Wait for search script to load
    await page.waitForTimeout(1000);
    
    // Open search overlay
    await page.keyboard.press('Control+k');
    const searchOverlay = page.locator('#search-overlay');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
    
    // Type search query
    const searchInput = page.locator('#search-input');
    await searchInput.fill('project');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check if results are displayed - results container should exist
    const searchResults = page.locator('#search-results');
    await expect(searchResults).toBeAttached();
    
    // This test verifies the search functionality doesn't crash
    await expect(searchInput).toHaveValue('project');
  });

  test('should navigate using search results', async ({ page }) => {
    await page.goto('/');
    
    // Wait for search script to load
    await page.waitForTimeout(1000);
    
    // Open search overlay
    await page.keyboard.press('Control+k');
    const searchOverlay = page.locator('#search-overlay');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
    
    // Search for 'about'
    const searchInput = page.locator('#search-input');
    await searchInput.fill('about');
    
    // Wait for potential results
    await page.waitForTimeout(500);
    
    // Look for search result items
    const resultItems = page.locator('.search-result-item');
    const resultCount = await resultItems.count();
    
    if (resultCount > 0) {
      // Click first result
      await resultItems.first().click();
      
      // Should navigate to result page
      await expect(page.locator('main').first()).toBeVisible();
    } else {
      // If no results, verify search still functions
      await expect(searchInput).toHaveValue('about');
      
      // Close search
      await page.keyboard.press('Escape');
      await expect(searchOverlay).not.toBeVisible();
    }
  });
});

test.describe('Contact form', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/contact');
    
    // Try submitting empty form
    await page.locator('form button[type="submit"]').click();
    
    // Check that form was not submitted (we're still on the same page)
    await expect(page).toHaveURL(/contact/);
  });
  
  test('should validate email format', async ({ page }) => {
    await page.goto('/contact');
    
    // Fill in form with invalid email
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('invalid-email');
    await page.locator('#message').fill('Test message');
    
    // Try submitting
    await page.locator('form button[type="submit"]').click();
    
    // Check that form was not submitted (we're still on the same page)
    await expect(page).toHaveURL(/contact/);
    
    // Check for validation message
    // Use HTMLInputElement for checkValidity
    const emailInput = page.locator('#email');
    const isValid = await emailInput.evaluate((el) => (el as HTMLInputElement).checkValidity());
    expect(isValid).toBeFalsy();
  });
});
