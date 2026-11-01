import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const theme of ['light', 'dark'] as const) {
  for (const path of [
    '/blog/ai-statistics-future-decision-making/',
    '/blog/building-my-own-local-llm-stack/',
    '/blog/combating-legal-ai-hallucinations/',
  ]) {
    test(`nested article surfaces preserve contrast: ${path} ${theme}`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
      await page.goto(path);
      await page.waitForFunction(
        () =>
          getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim()
            .length > 0
      );
      await page.evaluate(() => document.fonts.ready);
      const scan = await new AxeBuilder({ page })
        .include('.prose')
        .withRules(['color-contrast'])
        .analyze();
      expect(scan.violations).toEqual([]);
    });
  }
}
