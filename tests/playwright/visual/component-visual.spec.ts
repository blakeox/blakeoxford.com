import { test, expect } from '@playwright/test';
import { preparePage } from './_visualHelper';

// Component-level focused snapshots (smaller surface, faster diff isolation)
// Tags: @visual-essential @visual-components

const componentSelectors: Record<string, { route: string; selector: string }> = {
  navbar: { route: '/', selector: 'header nav#navbar, header nav[aria-label="Main navigation"], header nav' },
  footer: { route: '/', selector: 'footer' },
  searchOverlay: { route: '/', selector: '#search-overlay' }
};

test.describe('@visual-essential @visual-components Component Visual Snapshots', () => {
  for (const [name, cfg] of Object.entries(componentSelectors)) {
    test(`component visual ${name}`, async ({ page }) => {
      await preparePage(page);
      await page.goto(cfg.route, { waitUntil: 'networkidle' });
      // Open search overlay if needed
      if (name === 'searchOverlay') {
        const toggle = page.locator('#search-toggle, [data-test="open-search"], button:has-text("Search")').first();
        if (await toggle.isVisible()) await toggle.click();
        else {
          await page.keyboard.press('/');
          await page.keyboard.press('Meta+K');
          await page.keyboard.press('Control+K');
        }
        const overlay = page.locator(cfg.selector).first();
        await overlay.evaluate((el) => {
          // Ensure the overlay is in an open state consistent with CSS selectors
          el.setAttribute('data-state', 'open');
          el.classList.add('active');
          el.removeAttribute('inert');
          (el as HTMLElement).style.visibility = 'visible';
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.pointerEvents = 'auto';
        });
        // Blur any focused element inside the overlay to avoid focus ring diff
        await page.evaluate(() => {
          const overlay = document.querySelector('#search-overlay');
          if (overlay && overlay.contains(document.activeElement)) {
            (document.activeElement as HTMLElement).blur();
          }
        });
        await expect(overlay).toBeVisible();
      } else {
        await expect(page.locator(cfg.selector).first()).toBeVisible();
      }
      const element = page.locator(cfg.selector).first();
      // Normalize element height to integer pixels to avoid subpixel rounding differences across browsers
      await element.evaluate((el) => {
        try {
          el.style.boxSizing = 'border-box';
          const rect = el.getBoundingClientRect();
          const h = Math.round(rect.height);
          el.style.height = `${h}px`;
        } catch  { void 0; }
      });
      await expect(element).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.02,
        scale: 'css',
        // Allow small pixel variance
        threshold: 0.01
      });
    });
  }
});
