import { test, expect } from './fixtures';

test.describe('Playwright 1.56 New Features Demo', () => {
  test('demonstrate new page.consoleMessages(), page.pageErrors(), and page.requests() APIs', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Test new page.consoleMessages() API
    const consoleMessages = await page.consoleMessages();
    console.log(`📝 Console messages count: ${consoleMessages.length}`);

    // Test new page.pageErrors() API
    const pageErrors = await page.pageErrors();
    console.log(`❌ Page errors count: ${pageErrors.length}`);
    expect(pageErrors.length).toBe(0); // Should have no errors

    // Test new page.requests() API
    const requests = await page.requests();
    console.log(`🌐 Network requests count: ${requests.length}`);
    expect(requests.length).toBeGreaterThan(0); // Should have made requests

    // Verify page loaded successfully
    await expect(page.locator('h1')).toContainText('Blake Oxford');

    console.log('✅ All new Playwright 1.56 APIs tested successfully!');
  });
});
