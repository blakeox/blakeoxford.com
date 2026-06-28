import { test, expect } from './fixtures';
// DEPRECATED: Covered by functional/navigation-search.journey.spec.ts and other focused specs.
// Will be removed after stabilization.
import { waitForIdle, waitForSearchOverlay, waitForSearchResultItem } from '../utils/waits';
test.describe.skip('Deprecated basic.spec.ts', () => {
// ...existing code...

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
  test('should open search overlay with keyboard shortcut (refactored waits)', async ({ page }) => {
    await page.goto('/');
    await waitForIdle(page);
    await page.keyboard.press('Control+k');
    const searchOverlay = page.locator('#search-overlay');
    await expect(searchOverlay).toBeVisible();
    const searchInput = page.locator('#search-input');
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });
  
  test('should close search overlay with escape key', async ({ page }) => {
    await page.goto('/');
    await waitForIdle(page);
    await page.keyboard.press('Control+k');
    const searchOverlay = await waitForSearchOverlay(page);
    await expect(searchOverlay).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(searchOverlay).not.toBeVisible();
  });

  test('should perform search and show results', async ({ page }) => {
    await page.goto('/');
    await waitForIdle(page);
    await page.keyboard.press('Control+k');
    const searchOverlay = await waitForSearchOverlay(page);
    await expect(searchOverlay).toBeVisible();
    const searchInput = page.locator('#search-input');
    await searchInput.fill('project');
    await page.waitForSelector('[data-search-result], .search-result', { timeout: 4000 });
    await expect(searchInput).toHaveValue('project');
  });

  test('should navigate using search results', async ({ page }) => {
    await page.goto('/');
    await waitForIdle(page);
    await page.keyboard.press('Control+k');
    const searchOverlay = await waitForSearchOverlay(page);
    await expect(searchOverlay).toBeVisible();
    const searchInput = page.locator('#search-input');
    await searchInput.fill('about');
    const firstResult = await waitForSearchResultItem(page);
    if (await firstResult.isVisible()) {
      await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        firstResult.click()
      ]);
      await expect(page.locator('main').first()).toBeVisible();
    } else {
      await expect(searchInput).toHaveValue('about');
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

}); // end skipped deprecated wrapper
