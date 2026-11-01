import { test, expect } from '../fixtures';

test('enterprise AI search connects the site story to a project conversation', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__AUDIT__ = true;
  });
  await page.goto('/');
  await expect(page.locator('#about-me')).toContainText('Helping companies navigate AI');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  await dialog.getByRole('combobox').fill('enterprise');
  await dialog.getByRole('tab', { name: 'Pages', exact: true }).click();
  const results = dialog.getByRole('listbox', { name: 'Search results' });
  for (const title of ['About', 'Projects', 'Blog', 'Contact']) {
    await expect(results.getByRole('option', { name: title, exact: true })).toBeVisible();
  }
  await results.getByRole('option', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(
    page.getByRole('heading', { name: 'Turn your AI bottleneck into a plan' })
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Where do you want to take AI next?' })
  ).toBeVisible();
  await expect(page.locator('#turnstile-shell')).toHaveAttribute('data-turnstile-state', 'audit');
});
