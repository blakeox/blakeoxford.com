import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Ask uses the correct dialog behavior at ${width}px ${theme}`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/api/**', (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"error":"Local UI test"}',
        })
      );
      await page.goto('/blog/');
      await page.waitForFunction(
        () => (window as Window & { __navHydrated?: boolean }).__navHydrated === true
      );
      const launcher = page.getByRole('button', { name: 'Open Ask' });
      await launcher.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Ask' });
      await expect(dialog).toBeVisible();
      await dialog.evaluate(async (element) => {
        await Promise.all(
          element
            .getAnimations()
            .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined))
        );
      });
      await expect(dialog).toHaveAttribute('aria-modal', width < 640 ? 'true' : 'false');
      if (width < 640) {
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
          expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        }
        await expect(page.locator('body')).toHaveClass(/scroll-locked/);
      }
      const audit = await new AxeBuilder({ page })
        .include('[data-ai-chat-panel]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(launcher).toBeFocused();
      await expect(page.locator('body')).not.toHaveClass(/scroll-locked/);
    });
  }
}
