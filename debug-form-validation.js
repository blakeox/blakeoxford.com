import { test, expect } from '@playwright/test';

test('debug form validation', async ({ page }) => {
  await page.goto('http://localhost:4321/contact');
  await page.waitForLoadState('domcontentloaded');

  console.log('=== Before Form Submission ===');

  // Check initial state
  const nameError = await page.locator('#name-error').innerHTML();
  const emailError = await page.locator('#email-error').innerHTML();
  const messageError = await page.locator('#message-error').innerHTML();

  console.log('Name error initial state:', nameError);
  console.log('Email error initial state:', emailError);
  console.log('Message error initial state:', messageError);

  // Check error containers visibility
  console.log('Name error visible:', await page.locator('#name-error').isVisible());
  console.log('Email error visible:', await page.locator('#email-error').isVisible());
  console.log('Message error visible:', await page.locator('#message-error').isVisible());

  // Submit empty form
  console.log('\n=== Clicking Submit Button ===');
  await page.locator('#contact-form button[type="submit"]').click();

  // Wait for validation
  await page.waitForTimeout(1000);

  console.log('\n=== After Form Submission ===');

  // Check error states after submission
  const nameErrorAfter = await page.locator('#name-error').innerHTML();
  const emailErrorAfter = await page.locator('#email-error').innerHTML();
  const messageErrorAfter = await page.locator('#message-error').innerHTML();

  console.log('Name error after:', nameErrorAfter);
  console.log('Email error after:', emailErrorAfter);
  console.log('Message error after:', messageErrorAfter);

  // Check error containers visibility after submission
  console.log('Name error visible after:', await page.locator('#name-error').isVisible());
  console.log('Email error visible after:', await page.locator('#email-error').isVisible());
  console.log('Message error visible after:', await page.locator('#message-error').isVisible());

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
