import { test, expect } from './fixtures';
// DEPRECATED: Consolidated into functional/navigation-search.journey.spec.ts
test.describe.skip('Deprecated search-functionality.spec.ts', () => {
// ...existing code...

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open search overlay when search button is clicked', async ({ page }) => {
    // Click search button
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Verify search overlay is visible
    const searchDialog = page.getByRole('dialog', { name: 'Search' });
    await expect(searchDialog).toBeVisible();
    
    // Verify search input is focused
    const searchInput = page.getByRole('combobox', { name: 'Search' });
    await expect(searchInput).toBeFocused();
    
    // Verify all category buttons are present
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Blog' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pages' })).toBeVisible();
  });

  test('should close search overlay with close button', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    
    // Close search
    await page.getByRole('button', { name: 'Close search' }).click();
    
    // Verify search overlay is hidden
    await expect(page.getByRole('dialog', { name: 'Search' })).not.toBeVisible();
  });

  test('should close search overlay with Escape key', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    
    // Verify search overlay is hidden
    await expect(page.getByRole('dialog', { name: 'Search' })).not.toBeVisible();
  });

  test('should search and display results for projects', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Type search query
    const searchInput = page.getByRole('combobox', { name: 'Search' });
    await searchInput.fill('Microsoft');
    
    // Wait for results
    const searchResults = page.getByRole('listbox', { name: 'Search results' });
    await expect(searchResults).toBeVisible();
    
    // Verify results are shown
    const resultOptions = page.getByRole('option');
    await expect(resultOptions).toHaveCount(2); // Microsoft projects
    
    // Verify result content
    await expect(page.getByText('Microsoft Fabric')).toBeVisible();
    await expect(page.getByText('Microsoft 365')).toBeVisible();
    
    // Verify highlighting
    const highlightedText = page.locator('mark');
    await expect(highlightedText).toHaveCount(4); // 2 results × 2 mentions each
  });

  test('should filter by category', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Click Pages category
    await page.getByRole('button', { name: 'Pages' }).click();
    
    // Search for contact
    await page.getByRole('combobox', { name: 'Search' }).fill('contact');
    
    // Verify only page results shown
    const searchResults = page.getByRole('listbox', { name: 'Search results' });
    await expect(searchResults).toBeVisible();
    
    const resultOptions = page.getByRole('option');
    await expect(resultOptions).toHaveCount(1); // Only contact page
    
    // Verify it's the contact page
    await expect(page.getByText('📄 Contact')).toBeVisible();
    await expect(page.getByText('pages')).toBeVisible();
  });

  test('should navigate to search result when clicked', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Search and get results
    await page.getByRole('combobox', { name: 'Search' }).fill('Firebase');
    
    // Wait for results and click first one
    const firstResult = page.getByRole('option').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/projects\/ferment-app/);
    await expect(page).toHaveTitle(/Ferment App/);
    
    // Verify search overlay is closed
    await expect(page.getByRole('dialog', { name: 'Search' })).not.toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Verify mobile-optimized layout
    const searchDialog = page.getByRole('dialog', { name: 'Search' });
    await expect(searchDialog).toBeVisible();
    
    // Test search functionality
    await page.getByRole('combobox', { name: 'Search' }).fill('Swift');
    
    // Verify results
    const searchResults = page.getByRole('listbox', { name: 'Search results' });
    await expect(searchResults).toBeVisible();
    
    // Close search
    await page.keyboard.press('Escape');
    await expect(searchDialog).not.toBeVisible();
  });

  test('should show search suggestions when no query', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Verify suggestions are shown by default
    await expect(page.getByText('Search Suggestions')).toBeVisible();
    await expect(page.getByText('Search for "projects"')).toBeVisible();
    await expect(page.getByText('Search for "blog posts"')).toBeVisible();
    await expect(page.getByText('Search for "contact"')).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Search for something that doesn't exist
    await page.getByRole('combobox', { name: 'Search' }).fill('nonexistent');
    
    // Verify no results message
    await expect(page.getByText('No results found')).toBeVisible();
    await expect(page.getByText('Try different keywords')).toBeVisible();
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    // Search to get results
    await page.getByRole('combobox', { name: 'Search' }).fill('Microsoft');
    
    // Wait for results
    const searchResults = page.getByRole('listbox', { name: 'Search results' });
    await expect(searchResults).toBeVisible();
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    const firstResult = page.getByRole('option').first();
    await expect(firstResult).toBeFocused();
    
    // Navigate to second result
    await page.keyboard.press('ArrowDown');
    const secondResult = page.getByRole('option').nth(1);
    await expect(secondResult).toBeFocused();
    
    // Navigate back up
    await page.keyboard.press('ArrowUp');
    await expect(firstResult).toBeFocused();
    
    // Select with Enter
    await page.keyboard.press('Enter');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/projects\/Microsoft-Fabric/);
  });

  test('should be accessible', async ({ page }) => {
    // Open search
    await page.getByRole('button', { name: 'Open search' }).click();
    
    const searchDialog = page.getByRole('dialog', { name: 'Search' });
    
    // Verify ARIA attributes
    await expect(searchDialog).toHaveAttribute('aria-modal', 'true');
    
    const searchInput = page.getByRole('combobox', { name: 'Search' });
    await expect(searchInput).toHaveAttribute('aria-expanded', 'false');
    await expect(searchInput).toHaveAttribute('aria-controls', 'search-results');
    
    // Test with search results
    await searchInput.fill('Microsoft');
    
    const searchResults = page.getByRole('listbox', { name: 'Search results' });
    await expect(searchResults).toBeVisible();
    await expect(searchInput).toHaveAttribute('aria-expanded', 'false');
    
    // Verify result options have proper roles
    const resultOptions = page.getByRole('option');
    await expect(resultOptions.first()).toHaveAttribute('role', 'option');
  });
});
}); // end deprecated wrapper