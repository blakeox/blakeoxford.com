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

const PAGE_SECTIONS: Record<string, { path: string; sections: { name: string; selector: string; waitFor?: string }[] }> = {
  home: {
    path: '/',
    sections: [
      { name: 'hero', selector: 'main header, main h1' },
      { name: 'tech-stack', selector: '[data-section="tech-stack"], section#tech, .tech-stack' },
      { name: 'recent-projects', selector: '[data-section="projects"], section#projects' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  about: {
    path: '/about',
    sections: [
      { name: 'intro', selector: 'main h1' },
      { name: 'bio', selector: '[data-section="bio"], .bio, article' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  blog: {
    path: '/blog',
    sections: [
      { name: 'list', selector: 'main ul, main .posts, [data-section="posts"]' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  projects: {
    path: '/projects',
    sections: [
      { name: 'grid', selector: '[data-project-grid], .projects-grid, main section' },
      { name: 'footer', selector: 'footer' }
    ]
  },
  contact: {
    path: '/contact',
    sections: [
      { name: 'form', selector: 'form[action*="contact"], form[action="/api/contact"], form' },
      { name: 'footer', selector: 'footer' }
    ]
  }
};

// Reusable capture logic
async function prepareAndCapture(page, selector: string, name: string) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 10000 });
  // Slight settle time after visibility
  await page.waitForTimeout(150);
  await expect(locator).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    maxDiffPixels: 8000,
    threshold: 0.2
  });
}

for (const [pageKey, config] of Object.entries(PAGE_SECTIONS)) {
  test.describe(`Sectional visuals: ${pageKey}`, () => {
    test(`sections are visually stable: ${pageKey}`, async ({ page }) => {
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
            const refined = `${section.selector} :is(section,div,article,header,footer,main)`;
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
