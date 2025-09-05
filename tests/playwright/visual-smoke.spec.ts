import { test, expect } from '@playwright/test';

// Tag with @visual-smoke for selective execution
// Minimal set of high-value pages for early layout/render regressions.

const routes = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/projects', name: 'projects' }
];

for (const r of routes) {
  test(`visual smoke: ${r.name} @visual-smoke`, async ({ page }) => {
    await page.goto(r.path);
    // Wait for primary content landmark to exist
    await page.waitForSelector('main');
    // Basic layout stability heuristic
    await page.waitForTimeout(50); // short pause; consider replacing with waitForLayoutStability util if exported
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchSnapshot(`${r.name}.png`, { maxDiffPixelRatio: 0.02 });
  });
}
