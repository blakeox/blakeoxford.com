import { test, expect } from '@playwright/test';

// Helper to normalize visuals (reduce flake): fixed viewport, disable animations, prefer dark mode false.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
});

// Consolidated visual coverage for core routes (lightweight placeholder; real screenshots may be added later)
// Marked essential for potential snapshot baseline in future.
test.describe('@visual-essential Visual Route Smoke', () => {
  const routes = ['/', '/about/', '/projects/', '/blog/', '/contact/'];
  for (const route of routes) {
    test(`visual regression ${route}`, async ({ page }) => {
      // Avoid networkidle on pages with async widgets; DOMContentLoaded is sufficient for static capture
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
      // Screenshot masking dynamic regions (e.g. time, animated cursor) if any appear; adjust selectors as needed
  // Preserve existing snapshot naming scheme using underscores
  const base = route.replace(/\//g, '_').replace(/^_/, '');
  const name = (base || 'home') + '.png';

      // Base options for cross-browser stability
      const options: any = {
        animations: 'disabled',
        fullPage: true,
        mask: [],
        maskColor: '#ffffff',
        maxDiffPixelRatio: 0.01,
      };
      if (route === '/about/') {
        options.maxDiffPixelRatio = Math.max(options.maxDiffPixelRatio, 0.025);
      }

      // The contact page includes decorative animations and blurred shapes — mask them to avoid flake
      if (route === '/contact/') {
        const masks = [
          '#hero .absolute',
          '#contact-info .absolute',
          '.coin-flip',
        ];
        options.mask = masks.map((sel) => page.locator(sel));
        options.maxDiffPixelRatio = 0.02;

        // Chromium tends to render gradients/blurs a bit differently; allow a hair more tolerance
        const projectName = test.info().project.name || '';
        if (/chromium/i.test(projectName)) {
          options.maxDiffPixelRatio = 0.025;
        }
      }

  await expect(page).toHaveScreenshot(name, options);
    });
  }
});