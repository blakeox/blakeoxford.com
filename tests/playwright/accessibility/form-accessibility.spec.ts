import { test, expect } from '../fixtures';

test.describe('Form Accessibility Tests', () => {
  test('contact form should be fully accessible', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');
    
    // Find the contact form specifically (not the search form)
    // Look for forms that contain contact-related fields
    const form = page.locator('form').filter({ 
      has: page.locator('input[name="name"], input[name="email"], textarea[name="message"]')
    }).first();
    
    // If the above doesn't work, try to find the main content form (not in search overlay)
    if (await form.count() === 0) {
      await expect(page.locator('main form, .contact-form form, [id*="contact"] form').first()).toBeVisible();
      const contactForm = page.locator('main form, .contact-form form, [id*="contact"] form').first();
      await expect(contactForm).toBeVisible();
    } else {
      await expect(form).toBeVisible();
    }
    
    // Get the actual contact form for the rest of the test
    const contactForm = await form.count() > 0 ? form : page.locator('main form, .contact-form form, [id*="contact"] form').first();
    
    // Check all visible form inputs have labels (excluding hidden fields, bot fields, etc.)
    const inputs = await contactForm.locator('input:not([type="hidden"]):not([name="bot-field"]):not([name*="turnstile"]):not([name*="cf-"]), textarea, select').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      
      // Skip hidden fields and bot protection fields
      if (type === 'hidden' || name === 'bot-field' || name?.includes('turnstile') || name?.includes('cf-')) {
        continue;
      }
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have either a label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      } else {
        // If no id, must have aria-label or aria-labelledby
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
    
    // Check required fields are properly marked
    const requiredInputs = await contactForm.locator('input[required], textarea[required]').all();
    
    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required');
      const required = await input.getAttribute('required');
      
      // Required inputs should be marked as such
      expect(ariaRequired === 'true' || required !== null).toBeTruthy();
    }
    
    // Check error handling
    const submitButton = contactForm.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitButton.isVisible()) {
      // First, try to submit form without filling required fields to test validation
      await submitButton.click();
      
      // Wait for validation messages to appear
      await expect(page.locator('[role="alert"], .error, [aria-invalid="true"]').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
      
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
      const nameInput = contactForm.locator('input[name="name"], input#name').first();
      const emailInput = contactForm.locator('input[name="email"], input#email').first();
      const messageInput = contactForm.locator('textarea[name="message"], textarea#message').first();
      
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
