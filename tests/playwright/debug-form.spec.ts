import { test, expect } from '@playwright/test';

test.describe('Form Accessibility Debug', () => {
  test('debug contact form fields', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');
    
    // Find the contact form
    const form = page.locator('form').filter({ 
      has: page.locator('input[name="name"], input[name="email"], textarea[name="message"]')
    }).first();
    
    await expect(form).toBeVisible();
    
    // Get all inputs
    const inputs = await form.locator('input, textarea, select').all();
    
    console.log(`Found ${inputs.length} form fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      console.log(`Field ${i + 1}:`);
      console.log(`  - id: ${id}`);
      console.log(`  - name: ${name}`);
      console.log(`  - type: ${type}`);
      console.log(`  - aria-label: ${ariaLabel}`);
      console.log(`  - aria-labelledby: ${ariaLabelledby}`);
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        console.log(`  - has label: ${hasLabel}`);
        
        if (!hasLabel && !ariaLabel && !ariaLabelledby) {
          console.log(`  ❌ FAILING: No label found for field with id='${id}'`);
        } else {
          console.log('  ✅ OK: Field has proper labeling');
        }
      } else if (!ariaLabel && !ariaLabelledby) {
        console.log('  ❌ FAILING: Field has no id, aria-label, or aria-labelledby');
      }
    }
  });
});
