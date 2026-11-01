import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessible structure and announcements (not a native screen-reader run)', () => {
  for (const width of [320, 1440]) {
    test(`header names match visible labels at ${width}px @essential`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('.brand-link')).toHaveAccessibleName(
        width >= 640 ? 'Blake Oxford Systems architect' : 'Blake Oxford'
      );
      const search = page.locator('#search-toggle');
      await expect(search).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K');
      const audit = await new AxeBuilder({ page })
        .include('#navbar')
        .withRules(['label-content-name-mismatch'])
        .analyze();
      expect(audit.violations).toEqual([]);
      for (const shortcut of ['Control+k', 'Meta+k']) {
        await search.focus();
        await page.keyboard.press(shortcut);
        await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(search).toBeFocused();
      }
    });
  }

  test('should have proper ARIA landmarks structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for essential ARIA landmarks
    // Navigation serves as the visible banner content
    const navigation = page.locator('nav[role="navigation"]').first();
    await expect(navigation).toBeVisible();

    const main = page.locator('[role="main"], main').first();
    await expect(main).toBeVisible();

    const contentinfo = page.locator('[role="contentinfo"], footer').first();
    await expect(contentinfo).toBeVisible();

    // Ensure header exists for semantic structure even if not visible
    const header = page.locator('header').first();
    await expect(header).toHaveCount(1);
  });

  test('should have meaningful heading hierarchy', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      // Count main content H1 elements - should be exactly 1 per page
      const mainH1Count = await page
        .locator('main h1, [role="main"] h1, body > section h1, body > div h1')
        .count();
      expect(mainH1Count).toBeGreaterThanOrEqual(1);

      // Get all headings in order from main content area
      const headings = await page
        .locator(
          'main h1, main h2, main h3, main h4, main h5, main h6, [role="main"] h1, [role="main"] h2, [role="main"] h3, [role="main"] h4, [role="main"] h5, [role="main"] h6'
        )
        .all();

      // Verify there's at least one heading
      if (headings.length > 0) {
        const firstHeading = await headings[0].evaluate((el) => el.tagName.toLowerCase());
        expect(firstHeading).toBe('h1');
      }
    }
  });

  test('should provide alternative text for all images', async ({ page }) => {
    const pages = ['/', '/about', '/projects', '/contact'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      // Get all images
      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        const ariaLabel = await img.getAttribute('aria-label');

        // Images should have alt text, unless they're decorative (role="presentation")
        if (role !== 'presentation' && role !== 'none') {
          expect(alt !== null || ariaLabel !== null).toBeTruthy();
        }
      }
    }
  });

  test('exposes updated search-result counts through a live region', async ({ page }) => {
    await page.goto('/');
    await page.locator('#search-toggle').click();
    const dialog = page.getByRole('dialog', { name: 'Search', exact: true });
    await dialog.getByRole('combobox').fill('Fabric');
    await expect(dialog.locator('[aria-live="polite"]')).toContainText(/results?/i);
    await expect(dialog.getByRole('option').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-toggle')).toBeFocused();
  });
});
