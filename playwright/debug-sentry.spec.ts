import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

// This test simply triggers the browser error on the debug page
// It does not assert Sentry ingestion (external); check the Sentry UI for the event
// Tag as @essential to allow quick execution if you run the essential subset

test.describe('Sentry browser debug trigger @essential', () => {
  test('click throws and shows status', async ({ page }) => {
    await page.goto(`${BASE_URL}/debug/sentry-test`, { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: /throw test error/i });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const status = page.locator('#status');
    await expect(status).toBeVisible();
    // Give the global error handler a moment to propagate to Sentry
    await page.waitForTimeout(500);
  });
});
