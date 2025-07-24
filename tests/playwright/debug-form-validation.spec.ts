import { test } from '@playwright/test';

test('debug form validation', async ({ page }) => {
  // Capture console messages and errors
  const messages: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    messages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`Page error: ${err.message}`);
  });

  await page.goto('/contact'); // Use relative URL
  await page.waitForLoadState('domcontentloaded');

  console.log('\n=== JavaScript Errors Check ===');
  console.log('Console messages:', messages.length);
  console.log('Page errors:', errors.length);
  if (errors.length > 0) {
    errors.forEach(err => console.log('Error:', err));
  }

  console.log('\n=== Checking if validation script exists ===');

  // Check if the form exists
  const formExists = await page.locator('#contact-form').count();
  console.log('Form exists:', formExists > 0);

  // Check if the script content exists in the DOM
  const scriptContent = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts.some(script => script.textContent && script.textContent.includes('validateField'));
  });
  console.log('Validation script found in DOM:', scriptContent);

  // Check if the validation script is working by looking for its specific log message
  const validationLoaded = messages.some(msg => msg.includes('Contact form validation loaded'));
  console.log('Validation script loaded:', validationLoaded);

  console.log('\n=== Before Form Submission ===');

  // Submit empty form (trigger submit event directly)
  console.log('\n=== Triggering Form Submit Event ===');
  await page.locator('#contact-form').evaluate(form => {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
  });

  // Wait for validation
  await page.waitForTimeout(2000);

  console.log('\n=== After Form Submission ===');

  // Check if any errors were logged after submission
  console.log('Total console messages after submit:', messages.length);
  console.log('Total page errors after submit:', errors.length);

  // Check for form submission and validation messages
  const formSubmitted = messages.some(msg => msg.includes('Form submitted, validating'));
  const validationResult = messages.some(msg => msg.includes('Validation result:'));
  console.log('Form submission logged:', formSubmitted);
  console.log('Validation result logged:', validationResult);

  // Check error states after submission
  const nameErrorAfter = await page.locator('#name-error').innerHTML();
  const emailErrorAfter = await page.locator('#email-error').innerHTML();
  const messageErrorAfter = await page.locator('#message-error').innerHTML();

  console.log('Name error after:', nameErrorAfter);
  console.log('Email error after:', emailErrorAfter);
  console.log('Message error after:', messageErrorAfter);

  // Check aria-invalid states
  console.log('Name aria-invalid:', await page.locator('#name').getAttribute('aria-invalid'));
  console.log('Email aria-invalid:', await page.locator('#email').getAttribute('aria-invalid'));
  console.log('Message aria-invalid:', await page.locator('#message').getAttribute('aria-invalid'));

  // Check form status
  const formStatus = await page.locator('#form-status').innerHTML();
  const formStatusVisible = await page.locator('#form-status').isVisible();
  console.log('Form status:', formStatus);
  console.log('Form status visible:', formStatusVisible);
});
