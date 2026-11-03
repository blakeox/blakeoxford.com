import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Explicit opt-in: these tests read the real managed index and incur provider requests.
test.skip(
  process.env.SEARCH_LIVE !== '1',
  'Requires an isolated Worker with a remote AI_SEARCH binding'
);
for (const mobile of [false, true]) {
  test(`live Cloudflare search: ${mobile ? 'mobile' : 'desktop'}`, async ({
    browser,
    browserName,
  }, testInfo) => {
    const device = mobile
      ? devices[browserName === 'webkit' ? 'iPhone 13' : 'Pixel 7']
      : devices[browserName === 'webkit' ? 'Desktop Safari' : 'Desktop Chrome'];
    const context = await browser.newContext({ ...device, baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    const evidence: unknown[] = [];
    try {
      await page.goto('/blog/');
      await page.locator('#search-toggle').click();
      const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
      const input = dialog.getByRole('combobox');
      await expect(input).toBeFocused();
      const search = async (query: string) => {
        const started = Date.now();
        const responsePromise = page.waitForResponse(
          (r) =>
            r.url().endsWith('/api/semantic-search') &&
            r.request().method() === 'POST' &&
            r.request().postDataJSON().query === query
        );
        await input.fill(query);
        const response = await responsePromise;
        const body = await response.json();
        evidence.push({
          query,
          status: response.status(),
          provider: body.provider,
          elapsedMs: Date.now() - started,
          requestId: response.headers()['x-request-id'],
          urls: body.results?.map((r: { url: string }) => r.url),
        });
        expect(response.status()).toBe(200);
        expect(body.provider).toBe('ai-search');
        const urls = body.results.map((r: { url: string }) => r.url);
        expect(new Set(urls).size).toBe(urls.length);
        expect(urls.every((url: string) => url.startsWith('/') && !url.startsWith('//'))).toBe(
          true
        );
        await expect(page.locator('[data-command-center]')).toHaveAttribute(
          'data-search-loading',
          'false'
        );
        if (body.results.some((r: { url: string }) => r.url !== '/')) {
          await expect(page.locator('[data-search-backend="cloudflare-ai-search"]')).toBeVisible();
        }
        return body;
      };
      await search('workflow automation');
      await expect(dialog.getByRole('option').filter({ hasText: 'Microsoft Fabric' })).toHaveCount(
        1
      );
      const box = await dialog.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(560);
      expect(box!.height).toBeLessThanOrEqual(480);
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .include('[role="dialog"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations
      ).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('managed-results.png') });
      await search('purpleplatypusorchestra');
      await expect(dialog.getByRole('option')).toHaveCount(0);
      await expect(dialog.getByText(/No matches/i)).toBeVisible();
      // Deliberate local fault injection; this is recovery evidence, not a provider outage.
      await page.route('**/api/semantic-search', (route) =>
        route.fulfill({ status: 503, json: { error: 'Validation fault injection' } })
      );
      await input.fill('fabric');
      await expect(
        dialog.getByText('Showing keyword matches. Broader search is temporarily unavailable.')
      ).toBeVisible();
      await expect(dialog.getByRole('option').first()).toContainText('Microsoft Fabric');
      await page.unroute('**/api/semantic-search');
      await search('Microsoft Fabric');
      await expect(
        dialog.getByText('Showing keyword matches. Broader search is temporarily unavailable.')
      ).toBeHidden();
      const fabric = dialog.getByRole('option').filter({ hasText: 'Microsoft Fabric' }).first();
      if (mobile) await fabric.tap();
      else {
        await input.press('Enter');
      }
      await expect(page).toHaveURL(/\/projects\/microsoft-fabric\/$/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/Microsoft Fabric/i);
      await expect(dialog).toBeHidden();
      expect(await page.locator('main').getAttribute('inert')).toBeNull();
    } finally {
      await testInfo.attach('provider-evidence', {
        body: JSON.stringify(evidence, null, 2),
        contentType: 'application/json',
      });
      await context.close();
    }
  });
}
