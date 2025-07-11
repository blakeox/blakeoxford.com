// Quick manual test for form validation
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to contact page...');
    await page.goto('http://localhost:4326/contact', { waitUntil: 'domcontentloaded' });

    console.log('Looking for form...');
    const form = await page.locator('#contact-form');
    console.log('Form found:', await form.isVisible());

    console.log('Looking for submit button...');
    const submitButton = await page.locator('button[type="submit"]');
    console.log('Submit button found:', await submitButton.isVisible());

    console.log('Clicking submit button...');
    await submitButton.click();

    // Wait a moment for validation to trigger
    await page.waitForTimeout(1000);

    console.log('Looking for error messages...');
    const errorMessages = await page.locator('[role="alert"], .error, [aria-invalid="true"]').all();
    console.log('Found error elements:', errorMessages.length);

    for (let i = 0; i < errorMessages.length; i++) {
      const text = await errorMessages[i].textContent();
      console.log(`Error ${i + 1}:`, text?.trim());
    }

    // Also check the form status
    const formStatus = await page.locator('#form-status');
    const statusText = await formStatus.textContent();
    console.log('Form status:', statusText?.trim());
    console.log('Form status visible:', await formStatus.isVisible());

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
