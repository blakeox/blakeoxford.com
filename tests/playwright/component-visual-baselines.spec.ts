import { test, expect } from '@playwright/test';

// Visual baselines for critical components
// Tags: @visual @components

async function capture(page, route, name) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: false });
}

test.describe('Component Visual Baselines', () => {
  test('nav', async ({ page }) => {
    await capture(page, '/components/nav-preview', 'nav');
  });
  test('project card', async ({ page }) => {
    await capture(page, '/components/project-card-preview', 'project-card');
  });
});
