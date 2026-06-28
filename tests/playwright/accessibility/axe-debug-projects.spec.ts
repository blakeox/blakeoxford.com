import { test } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

// Debug helper: isolate /projects axe scan and log color-contrast violation node details.
// Tagged @debug so it can be filtered out of normal essential runs.
test.describe('@debug @accessibility-debug projects color contrast', () => {
  test('log color-contrast nodes on /projects', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a','wcag2aa'])
      .analyze();
    const cc = results.violations.find(v => v.id === 'color-contrast');
    if (!cc) {
      console.log('[a11y-debug] No color-contrast violations on /projects');
      return;
    }
    console.log(`[a11y-debug] color-contrast count=${cc.nodes.length}`);
    for (const n of cc.nodes) {
      // Print key info for remediation
      const targets = (n.target || []).join(',');
      const snippet = (n.html || '').replace(/\s+/g,' ').slice(0,180);
      console.log(`[a11y-debug] target=${targets} snippet="${snippet}" impact=${n.impact}`);
    }
  });
});
