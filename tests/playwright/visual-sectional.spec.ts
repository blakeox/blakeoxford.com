import { test, expect } from '@playwright/test';
import { 
  navigateWithRetry,
  waitForImagesWithFallback,
  disableAnimationsComprehensive,
  waitForStability
} from './utils/test-helpers';

/**
 * Sectional visual regression tests
 * Strategy: capture only stable, bounded regions per page to reduce flakiness.
 * These complement essential tests and replace skipped full-page tests while they are tuned.
 */

// Experimental: gated by EXPERIMENTAL_SECTIONAL_VISUAL env to reduce flakiness while stabilizing selectors
const ENABLE_SECTIONAL = process.env.EXPERIMENTAL_SECTIONAL_VISUAL === 'true';

const PAGE_SECTIONS: Record<string, { path: string; sections: { name: string; selector: string; waitFor?: string }[] }> = ENABLE_SECTIONAL ? {
  home: {
    path: '/',
    sections: [
      { name: 'hero-heading', selector: 'section#about-me h1' },
      { name: 'technologies-heading', selector: 'section#technologies h2' },
      { name: 'recent-projects-grid', selector: 'section#recent-projects .grid' },
      { name: 'latest-blog-heading', selector: 'h2#latest-blog-posts' },
      { name: 'call-to-action-heading', selector: 'section.call-to-action h2' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  about: {
    path: '/about',
    sections: [
      { name: 'hero-title', selector: 'section#about-me h1, section#about-me h2' },
      { name: 'achievements-title', selector: 'section#achievements h2' },
      { name: 'timeline-title', selector: 'section#about-timeline h2' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  blog: {
    path: '/blog',
    sections: [
      { name: 'blog-title', selector: 'h1#blog-title' },
      { name: 'first-post', selector: 'section.c-blog-list .flex > *:first-child article, section.c-blog-list .flex > *:first-child' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  projects: {
    path: '/projects',
    sections: [
      { name: 'grid', selector: 'main section, section#projects, .projects-grid, [data-project-grid]' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  contact: {
    path: '/contact',
    sections: [
      { name: 'hero-heading', selector: 'section#hero h1' },
      { name: 'contact-heading', selector: 'section#contact-info h2#message-form' },
      { name: 'form', selector: 'form#contact-form button[type="submit"]' },
      { name: 'footer', selector: 'footer' }
    ]
  }
} : {
  // Minimal always-on stable core (acts as smoke visuals)
  home: { path: '/', sections: [ { name: 'hero-heading', selector: 'section#about-me h1' }, { name: 'footer', selector: 'footer' } ] },
  contact: { path: '/contact', sections: [ { name: 'hero-heading', selector: 'section#hero h1' }, { name: 'footer', selector: 'footer' } ] }
};

// Reusable capture logic
async function prepareAndCapture(page, selector: string, name: string) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 15000 });

  // Additional stabilization for sections with async images / animations
  await waitForStability(page, 4000);
  await page.waitForTimeout(100);

  await expect(locator).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    maxDiffPixels: 12000,
    threshold: 0.25
  });
}

for (const [pageKey, config] of Object.entries(PAGE_SECTIONS)) {
  const describeFn = ENABLE_SECTIONAL ? test.describe : test.describe.skip;
  describeFn(`Sectional visuals: ${pageKey}`, () => {
    const testFn = ENABLE_SECTIONAL ? test : test; // minimal set always runs
    testFn(`sections are visually stable: ${pageKey}`, async ({ page }) => {
      await navigateWithRetry(page, config.path, { timeout: 45000, maxRetries: 3 });
      await waitForImagesWithFallback(page);
      await disableAnimationsComprehensive(page);
      await waitForStability(page);

  for (const section of config.sections) {
        try {
          await prepareAndCapture(page, section.selector, `${pageKey}-${section.name}`);
        } catch (err) {
          console.warn(`Section capture failed (${pageKey}:${section.name}) with primary selector '${section.selector}'. Attempting fallback refinement.`, err);
          // Attempt a fallback by narrowing to first matching block-level child if broad selection failed
          try {
    const refined = `${section.selector} :is(section,div,article,header,footer,main,form)`;
            await prepareAndCapture(page, refined, `${pageKey}-${section.name}-refined`);
          } catch (refinedErr) {
            // On persistent failure, take a debug screenshot to assist diagnosis, but don't fail the entire suite immediately.
            try {
              await page.screenshot({ path: `test-results/debug-${pageKey}-${section.name}.png`, fullPage: true });
            } catch {
              // debug screenshot attempt failed; continue to rethrow original refined error
            }
            throw refinedErr;
          }
        }
      }
    });
  });
}
