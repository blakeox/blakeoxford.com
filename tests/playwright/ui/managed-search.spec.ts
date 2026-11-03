import { test, expect } from '@playwright/test';

const result = (url: string, title: string, score = 0.94) => ({
  id: url,
  url,
  title,
  score,
  description: 'Connected systems and practical automation',
  collection: 'project',
  tags: [],
});
for (const width of [320, 390, 768, 900, 1440]) {
  test(`managed search is accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/api/semantic-search', (route) =>
      route.fulfill({
        json: {
          provider: 'ai-search',
          results: [result('/projects/microsoft-fabric/', 'Microsoft Fabric')],
        },
      })
    );
    await page.goto('/');
    const trigger = page.locator('#search-toggle');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
    const input = dialog.getByRole('combobox');
    await expect(input).toBeFocused();
    await input.fill('connect scattered systems');
    await expect(dialog.locator('[data-search-source="ai-search"]')).toHaveCount(1);
    await expect(dialog.getByRole('option').first()).toContainText('Microsoft Fabric');
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await input.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
test('keyword fallback remains usable and explains degradation', async ({ page }) => {
  await page.route('**/api/semantic-search', (route) =>
    route.fulfill({ status: 503, json: { error: 'Unavailable' } })
  );
  await page.goto('/');
  await page.locator('#search-toggle').click();
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
  await dialog.getByRole('combobox').fill('fabric');
  await expect(
    dialog.getByText('Showing keyword matches. Broader search is temporarily unavailable.')
  ).toBeVisible();
  await expect(dialog.getByRole('option').first()).toContainText('Microsoft Fabric');
});
test('a response from the previous query cannot replace newer results', async ({ page }) => {
  let releaseOld!: () => void;
  const old = new Promise<void>((resolve) => {
    releaseOld = resolve;
  });
  await page.route('**/api/semantic-search', async (route) => {
    const query = route.request().postDataJSON().query;
    if (query === 'older') await old;
    await route.fulfill({
      json: { provider: 'ai-search', results: [result(`/projects/${query}/`, `${query} result`)] },
    });
  });
  await page.goto('/');
  await page.locator('#search-toggle').click();
  const input = page.getByRole('combobox');
  await input.fill('older');
  await page.waitForRequest(
    (req) => req.url().includes('/api/semantic-search') && req.postDataJSON().query === 'older'
  );
  await input.fill('newer');
  releaseOld();
  await expect(page.getByRole('option').first()).toContainText('newer result');
  await expect(page.getByRole('option').filter({ hasText: 'older result' })).toHaveCount(0);
});

test('keyboard selection survives managed result refinement', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/semantic-search', async (route) => {
    await pending;
    await route.fulfill({
      json: {
        provider: 'ai-search',
        results: [result('/projects/conceptual/', 'Connected operations')],
      },
    });
  });
  await page.goto('/');
  await page.locator('#search-toggle').click();
  const input = page.getByRole('combobox');
  await input.fill('automation');
  await expect.poll(() => page.getByRole('option').count()).toBeGreaterThan(1);
  await input.press('ArrowDown');
  const selectedTitle = await page
    .locator('[role="option"][aria-selected="true"] [id^="command-title-"]')
    .textContent();
  release();
  await expect(page.locator('[data-search-source="ai-search"]')).toHaveCount(1);
  await expect(
    page.locator('[role="option"][aria-selected="true"] [id^="command-title-"]')
  ).toHaveText(selectedTitle!);
});

for (const width of [390, 1440]) {
  test(`familiar landing-page names survive compact ranking at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/api/semantic-search', (route) =>
      route.fulfill({
        json: {
          provider: 'ai-search',
          results: Array.from({ length: 8 }, (_, i) =>
            result(`/projects/example-${i}/`, `Example ${i}`, 0.99)
          ),
        },
      })
    );
    await page.goto('/blog/');
    await page.locator('#search-toggle').click();
    const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
    for (const [query, href] of [
      ['projects', '/projects/'],
      ['blog', '/blog/'],
      ['work', '/projects/'],
      ['writing', '/blog/'],
    ]) {
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith('/api/semantic-search') && r.request().postDataJSON()?.query === query
      );
      await dialog.getByRole('combobox').fill(query);
      await response;
      await expect(page.locator('[data-command-center]')).toHaveAttribute(
        'data-search-loading',
        'false'
      );
      await expect(dialog.locator(`[role="option"][href="${href}"]`)).toBeVisible();
      await expect(dialog.getByRole('option').first()).toHaveAttribute('href', href);
    }
  });
}
