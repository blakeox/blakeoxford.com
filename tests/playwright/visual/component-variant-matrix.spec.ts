import { test, expect } from '../fixtures';
import { getVisualVariantCases } from '../../../src/data/design-system/variantMatrix';

/**
 * Generated canonical variant coverage.
 *
 * The matrix renders each public visual key on the production-preview design page. Theme and
 * viewport dimensions are kept in the generated test name; dedicated route/theme suites own the
 * actual light/dark and responsive screenshot permutations so this does not create an explosion.
 */
test.describe('@visual-essential @visual-components Generated variant matrix', () => {
  for (const entry of getVisualVariantCases()) {
    for (const theme of entry.themes) {
      for (const viewport of entry.viewports) {
        test(`variant ${entry.id} | theme=${theme} | viewport=${viewport} | state=canonical`, async ({
          page,
        }) => {
          await page.setViewportSize(
            viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 }
          );
          await page.addInitScript((selectedTheme) => {
            window.localStorage.setItem('theme', selectedTheme);
          }, theme);
          await page.goto(entry.visualSurface ?? '/design/components/', {
            waitUntil: 'networkidle',
          });
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

          const variant = page.locator(
            `[data-variant-component="${entry.component}"][data-variant-recipe="${entry.recipe}"][data-variant-key="${entry.variant}"]`
          );
          await expect(variant, entry.id).toBeVisible();

          const focusTarget = variant.locator('button, a, input, textarea, select').first();
          if (await focusTarget.count()) {
            await focusTarget.focus();
            await expect(focusTarget, `${entry.id} keyboard focus`).toBeFocused();
          }
        });
      }
    }
  }
});
