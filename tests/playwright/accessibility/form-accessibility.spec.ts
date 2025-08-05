import { test, expect } from '@playwright/test';

test.describe('Form Accessibility Tests', () => {
  test('contact form should be fully accessible', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');
    
    // Check form exists
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    
    // Check all form inputs have labels
    const inputs = await form.locator('input, textarea, select').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have either a label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
    
    // Check required fields are properly marked
    const requiredInputs = await form.locator('input[required], textarea[required]').all();
    
    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required');
      const required = await input.getAttribute('required');
      
      // Required inputs should be marked as such
      expect(ariaRequired === 'true' || required !== null).toBeTruthy();
    }
    
    // Check error handling
    const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitButton.isVisible()) {
      // First, try to submit form without filling required fields to test validation
      await submitButton.click();
      
      // Wait a moment for validation
      await page.waitForTimeout(1000);
      
      // Check if error messages are accessible
      const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        // Error messages should be announced to screen readers
        const firstError = errorMessages.first();
        const ariaLive = await firstError.getAttribute('aria-live');
        const role = await firstError.getAttribute('role');
        
        expect(ariaLive || role).toBeTruthy();
      }
      
      // Now fill out the form properly to test successful submission flow
      const nameInput = form.locator('input[name="name"], input#name').first();
      const emailInput = form.locator('input[name="email"], input#email').first();
      const messageInput = form.locator('textarea[name="message"], textarea#message').first();
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
      }
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
      }
      if (await messageInput.isVisible()) {
        await messageInput.fill('This is a test message for accessibility testing.');
      }
      
      // The form should now be ready for submission (though we won't actually submit in tests)
      // Just verify the fields are properly filled and accessible
      if (await nameInput.isVisible()) {
        expect(await nameInput.inputValue()).toBe('Test User');
      }
      if (await emailInput.isVisible()) {
        expect(await emailInput.inputValue()).toBe('test@example.com');
      }
      if (await messageInput.isVisible()) {
        expect(await messageInput.inputValue()).toBe('This is a test message for accessibility testing.');
      }
    }
  });
});
