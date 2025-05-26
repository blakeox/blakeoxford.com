import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Blake Oxford/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav a')).toHaveCount(await page.locator('nav a').count());
  });

  test('should toggle theme', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.locator('#theme-toggle');
    
    // Get initial theme state
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    // Click the theme toggle
    await themeToggle.click();
    
    // Check that theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Search functionality', () => {
  test('should open search overlay with keyboard shortcut', async ({ page }) => {
    await page.goto('/');
    
    // Press the '/' key to open search
    await page.keyboard.press('/');
    
    // Verify search overlay is visible
    await expect(page.locator('#search-overlay')).toHaveClass(/active/);
  });
  
  test('should close search overlay with escape key', async ({ page }) => {
    await page.goto('/');
    
    // Open search first
    await page.keyboard.press('/');
    await expect(page.locator('#search-overlay')).toHaveClass(/active/);
    
    // Press escape to close
    await page.keyboard.press('Escape');
    
    // Verify search overlay is hidden
    await expect(page.locator('#search-overlay')).not.toHaveClass(/active/);
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
    const emailInput = page.locator('#email');
    const isValid = await emailInput.evaluate((el) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });
});
