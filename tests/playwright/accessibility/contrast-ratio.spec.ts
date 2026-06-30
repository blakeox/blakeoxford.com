import { test } from '../fixtures';
import { applyThemeOnPage } from '../../utils/colorContrast';
import { assertHeroCtaContrast, runContrastCheck } from '../../utils/contrastCheck';

// Lightweight contrast ratio check for key text elements.
// Tags: @accessibility-extended
// Runs in BOTH light and dark themes so regressions are caught per theme.

const baseRoutes = [
  '/',
  '/about/',
  '/projects/',
  '/blog/',
  '/projects/google-workspace-migration/',
  '/blog/combating-legal-ai-hallucinations/',
];

const injected = (process.env.CONTRAST_EXTRA_ROUTES || '')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);

const routes = Array.from(new Set([...baseRoutes, ...injected]));
const themes = ['light', 'dark'] as const;

test.describe('@accessibility-extended Contrast Ratios', () => {
  for (const theme of themes) {
    for (const route of routes) {
      test(`contrast ratios acceptable ${route} (${theme} mode)`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => (window as { __navHydrated?: boolean }).__navHydrated === true).catch(() => undefined);
        await applyThemeOnPage(page, theme);

        if (route.includes('combating-legal-ai-hallucinations')) {
          await page.evaluate(() => {
            document
              .querySelectorAll('.bg-red-50, .bg-yellow-50, [role="alert"]')
              .forEach((el) => {
                (el as HTMLElement).setAttribute('data-a11y-allow-color-contrast', '');
              });
          });
        }

        if (route === '/') {
          await assertHeroCtaContrast(page, route, theme);
        }

        const { sampled, borderline } = await runContrastCheck(page, { route, theme });

        if (borderline.length) {
          console.log(
            `[contrast][borderline] theme=${theme} route=${route} count=${borderline.length} sampled=${sampled}`,
          );
          for (const b of borderline) {
            console.log(
              `  near-threshold sel=${b.sel} ratio=${b.ratio.toFixed(2)} min=${b.min} large=${b.large} classes="${b.classes}"`,
            );
          }
        } else {
          console.log(`[contrast] theme=${theme} route=${route} all-passing-with-buffer sampled=${sampled}`);
        }

        if (process.env.CONTRAST_JSON) {
          const payload = {
            theme,
            route,
            sampled,
            borderline: borderline.map((b) => ({
              sel: b.sel,
              ratio: +b.ratio.toFixed(2),
              min: b.min,
              large: b.large,
            })),
          };
          console.log(`__CONTRAST_PAYLOAD__${JSON.stringify(payload)}`);
        }
      });
    }
  }
});
