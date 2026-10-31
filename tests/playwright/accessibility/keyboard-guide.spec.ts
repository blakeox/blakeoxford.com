import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`keyboard reference is readable and provides working navigation at ${width}px ${theme}`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.goto('/accessibility/keyboard-shortcuts/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keyboard shortcuts');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
      ).toBe(true);
      const scan = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
      // WebKit on this Mac uses Option-Tab for links under its native keyboard preference.
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(
        page.getByRole('link', { name: 'Skip to main content', exact: true })
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
      const report = page.getByRole('link', { name: 'Report an accessibility issue' });
      await expect(report).toHaveAttribute('href', '/contact/');
      await report.click();
      await expect(page).toHaveURL(/\/contact\/$/);
    });
  }
}
