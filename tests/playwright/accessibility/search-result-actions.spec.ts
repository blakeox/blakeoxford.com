import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`selected search actions preserve semantics and functions at ${width}px ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => {
        localStorage.setItem('theme', value);
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              (window as any).__copiedLink = text;
            },
          },
        });
      }, theme);
      await page.route('**/api/ai-search', (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"error":"local-test"}',
        })
      );
      await page.goto('/blog/');
      await page.locator('#search-toggle').click();
      const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
      const input = dialog.getByRole('combobox');
      await input.fill('fabric');
      const results = dialog.getByRole('listbox', { name: 'Search results' });
      await expect(results.getByRole('option').first()).toBeVisible();
      await expect(
        results.locator('[role="option"] button, [role="option"] a, [role="option"] input')
      ).toHaveCount(0);
      const actions = dialog.getByRole('group', { name: /^Actions for Microsoft Fabric/ });
      await expect(actions).toBeVisible();
      expect(await actions.evaluate((element) => !!element.closest('[role="listbox"]'))).toBe(
        false
      );
      await input.focus();
      await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(0, 3));
      await input.dispatchEvent('keydown', { key: 'c', metaKey: true });
      expect(await page.evaluate(() => (window as any).__copiedLink)).toBeUndefined();
      await input.evaluate((element: HTMLInputElement) =>
        element.setSelectionRange(element.value.length, element.value.length)
      );
      const copy = actions.getByRole('button', { name: /^Copy link for/ });
      await copy.click();
      await expect(actions.getByRole('button', { name: 'Link copied' })).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => (window as any).__copiedLink))
        .toMatch(/\/projects\/microsoft-fabric\/$/);
      await actions.getByRole('button', { name: 'Search for Power BI', exact: true }).click();
      await expect(input).toHaveValue('Power BI');
      await input.fill('fabric');
      await expect(actions).toBeVisible();
      const scan = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
      for (const button of await actions.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      await actions.getByRole('button', { name: /^Ask about/ }).click();
      await expect(dialog).toBeHidden();
      await expect(page.locator('[data-ai-chat-panel]')).toBeVisible();
      await expect(page.locator('[data-ai-chat-panel]')).toHaveAttribute('data-ai-visible', 'true');
    });
  }
}

test('result links retain native modifier-click and ordinary navigation', async ({ page }) => {
  await page.goto('/blog/');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  const result = dialog.getByRole('option').first();
  const href = await result.getAttribute('href');
  const [popup] = await Promise.all([
    page.context().waitForEvent('page'),
    result.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] }),
  ]);
  await expect(popup).toHaveURL(new URL(href!, page.url()).href);
  await popup.close();
  await expect(dialog).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(new URL(href!, page.url()).href);
});
