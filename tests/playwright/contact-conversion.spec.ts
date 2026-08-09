import { test, expect } from './fixtures';

test.describe('Contact conversion contract', () => {
  test('records a lead only after a successful delivery response @essential', async ({ page }) => {
    const submittedBodies: string[] = [];

    await page.addInitScript(() => {
      (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer = [];
      (window as Window & { __AUDIT__?: boolean }).__AUDIT__ = true;
    });

    await page.route('**/send-email', async (route) => {
      submittedBodies.push(route.request().postData() ?? '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Email queued',
          id: 'playwright-contract-test',
        }),
      });
    });

    await page.goto('/contact/');

    const contactForm = page.locator('#contact-form');
    await contactForm.locator('#name').fill('Playwright Contract Test');
    await contactForm.locator('#email').fill('contract-test@example.com');
    await contactForm
      .locator('#message')
      .fill('This verifies the successful contact conversion path.');

    // Automated audits skip the real Turnstile widget. Keep this token synthetic and local to
    // the contract test so the production form still requires a real verification response.
    await contactForm.evaluate((form) => {
      const token = document.createElement('input');
      token.type = 'hidden';
      token.name = 'cf-turnstile-response';
      token.value = 'playwright-contract-token';
      form.appendChild(token);
    });
    await contactForm.locator('button[type="submit"]').click();

    await expect(page.locator('#form-status')).toHaveText(
      'Your project brief was sent. I’ll review it and follow up by email.'
    );
    expect(submittedBodies).toHaveLength(1);
    expect(submittedBodies[0]).toContain('Playwright Contract Test');
    expect(submittedBodies[0]).toContain('contract-test@example.com');
    expect(submittedBodies[0]).toContain('playwright-contract-token');

    await expect
      .poll(() =>
        page.evaluate(
          () => (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? []
        )
      )
      .toContainEqual({
        event: 'generate_lead',
        method: 'contact_form',
        form: 'contact',
        acquisition_source: 'direct',
      });
  });
});
