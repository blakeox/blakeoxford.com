import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`empty search stays usable at ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
      await page.route('**/api/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"results":[]}' })
      );
      await page.goto('/blog/');
      const trigger = page.locator('#search-toggle');
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('combobox').fill('zzzznotarealproject');
      await expect(dialog.getByText('Try a shorter keyword, or pick an example.')).toBeVisible();
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      }
      const audit = await new AxeBuilder({ page })
        .include('#search-overlay')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }
}

test('Tab accepts a matching title before advancing modal focus', async ({ page }) => {
  await page.goto('/blog/');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  const input = dialog.getByRole('combobox');
  await input.fill('fabric');
  await expect(dialog.getByRole('region', { name: 'Title suggestions' })).toBeVisible();
  await input.press('Tab');
  await expect(input).toHaveValue(/microsoft fabric/i);
  await expect(input).toBeFocused();
  await input.press('Tab');
  await expect(input).not.toBeFocused();
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
});
