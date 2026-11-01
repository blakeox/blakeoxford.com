import { test, expect } from '../fixtures';

for (const theme of ['light', 'dark'] as const) {
  test(`contact shows validation, pending, recoverable error, and completion in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((theme) => {
      (window as Window & { __AUDIT__?: boolean }).__AUDIT__ = true;
      localStorage.setItem('theme', theme);
    }, theme);
    let releaseRequest: (() => void) | undefined;
    let attempts = 0;
    await page.route('**/send-email', async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await new Promise<void>((resolve) => {
          releaseRequest = resolve;
        });
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ success: false }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 'local-design-state-test' }),
        });
      }
    });
    await page.goto('/contact/');
    await expect(page.locator('#turnstile-shell')).toHaveAttribute('data-turnstile-state', 'audit');
    const form = page.locator('#contact-form');
    const submit = form.getByRole('button', { name: 'Send project brief' });
    await submit.click();
    await expect(form.locator('#name')).toBeFocused();
    await expect(form.locator('#name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#name-error')).toContainText('required');
    await form.locator('#name').fill('Design State Test');
    await form.locator('#email').fill('design-state@example.com');
    await form
      .locator('#message')
      .fill('This is a local test of a recoverable project brief submission.');
    await form.evaluate((form) => {
      const token = document.createElement('input');
      token.type = 'hidden';
      token.name = 'cf-turnstile-response';
      token.value = 'local-design-test-token';
      form.append(token);
    });
    await submit.click();
    await expect(form.locator('button[type="submit"]')).toBeDisabled();
    await expect(form.locator('button[type="submit"]')).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => !!releaseRequest).toBe(true);
    releaseRequest!();
    await expect(page.locator('#form-status')).toContainText('could not be sent');
    await expect(form.locator('#message')).toHaveValue(
      'This is a local test of a recoverable project brief submission.'
    );
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.locator('#form-status')).toContainText('was sent');
    await expect(page.locator('#form-status')).toBeFocused();
    await expect(form).toBeHidden();
    expect(attempts).toBe(2);
  });
}
