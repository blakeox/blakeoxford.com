import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const hits = [
  {
    id: 'systems',
    url: '/projects/search-systems/',
    title: 'Connecting enterprise systems with reliable data and workflow automation',
    description:
      'A practical approach to connecting operational data, reducing manual work, and helping teams make clear decisions.',
    score: 0.96,
    collection: 'project',
    tags: ['automation'],
  },
  {
    id: 'writing',
    url: '/blog/search-ideas/',
    title: 'What changes when AI becomes part of everyday work',
    description: 'Lessons from applying technology to real operational constraints.',
    score: 0.89,
    collection: 'blog',
    tags: ['AI'],
  },
];
for (const width of [320, 390, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`compact search at ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.route('**/api/semantic-search', (route) =>
        route.fulfill({ json: { provider: 'ai-search', results: hits } })
      );
      await page.goto('/');
      await page.locator('#search-toggle').click();
      const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
      const input = dialog.getByRole('combobox');
      await expect(input).toBeFocused();
      const idle = await dialog.boundingBox();
      expect(idle!.height).toBeLessThanOrEqual(80);
      expect(idle!.width).toBe(width < 640 ? width - 24 : 560);
      await expect(dialog.getByRole('button')).toHaveCount(1);
      await expect(dialog.getByRole('region')).toHaveCount(0);
      await input.fill('connected systems');
      await expect(dialog.locator('[data-search-source="ai-search"]')).toHaveCount(2);
      const geometry = await dialog.evaluate((el) => ({
        width: el.clientWidth,
        height: el.getBoundingClientRect().height,
        top: el.getBoundingClientRect().top,
        bottom: el.getBoundingClientRect().bottom,
        overflow: el.scrollWidth > el.clientWidth,
        viewport: innerHeight,
      }));
      expect(geometry.height).toBeLessThanOrEqual(480);
      expect(geometry.top).toBeGreaterThanOrEqual(12);
      expect(geometry.bottom).toBeLessThan(geometry.viewport);
      expect(geometry.overflow).toBe(false);
      await expect(dialog.getByRole('button')).toHaveCount(2);
      await expect(dialog.getByRole('option').first()).toContainText(hits[0].title);
      expect(
        (
          await new AxeBuilder({ page })
            .include('[role="dialog"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations
      ).toEqual([]);
      await input.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Clear search', exact: true })).toBeFocused();
      await expect(input).toHaveValue('connected systems');
      await input.focus();
      await input.press('ArrowDown');
      await input.press('Enter');
      await expect(page).toHaveURL(/\/blog\/search-ideas\/$/);
    });
  }
}
test('refinement keeps the search field stable and composition cannot navigate', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/semantic-search', async (route) => {
    await pending;
    await route.fulfill({ json: { provider: 'ai-search', results: hits } });
  });
  await page.goto('/');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  const input = dialog.getByRole('combobox');
  const before = await input.boundingBox();
  await input.fill('connected systems');
  release();
  await expect(dialog.locator('[data-search-source="ai-search"]')).toHaveCount(2);
  expect((await input.boundingBox())!.y).toBe(before!.y);
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await expect(dialog).toBeVisible();
  await input.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#search-toggle')).toBeFocused();
});
for (const viewport of [
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(`compact search fits ${viewport.width} by ${viewport.height} with enlarged text`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/semantic-search', (route) =>
      route.fulfill({ json: { provider: 'ai-search', results: hits } })
    );
    await page.goto('/');
    await page.addStyleTag({ content: 'html { font-size:200% !important; }' });
    await page.locator('#search-toggle').click();
    const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
    await dialog.getByRole('combobox').fill('connected systems');
    await expect(dialog.getByRole('option').first()).toBeInViewport({ ratio: 0.1 });
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.getByRole('button', { name: 'Close search', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
}
test('clearing search returns to the small field-only state', async ({ page }) => {
  await page.route('**/api/semantic-search', (route) =>
    route.fulfill({ json: { provider: 'ai-search', results: hits } })
  );
  await page.goto('/');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  const input = dialog.getByRole('combobox');
  await input.fill('connected systems');
  await expect(dialog.getByRole('option').first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(dialog.getByRole('option')).toHaveCount(0);
  expect((await dialog.boundingBox())!.height).toBeLessThanOrEqual(80);
});
test('the search shortcut toggles after lazy loading', async ({ page }) => {
  await page.goto('/');
  const shortcut = process.platform === 'darwin' ? 'Meta+k' : 'Control+k';
  await page.keyboard.press(shortcut);
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  await expect(dialog.getByRole('combobox')).toBeFocused();
  await page.keyboard.press(shortcut);
  await expect(dialog).toBeHidden();
  await page.keyboard.press(shortcut);
  await expect(dialog.getByRole('combobox')).toBeFocused();
});

test('clicking outside the compact panel closes it and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  await expect(dialog.getByRole('combobox')).toBeFocused();
  await page.locator('[data-command-center] > button').click({ position: { x: 4, y: 4 } });
  await expect(dialog).toBeHidden();
  await expect(page.locator('#search-toggle')).toBeFocused();
});
