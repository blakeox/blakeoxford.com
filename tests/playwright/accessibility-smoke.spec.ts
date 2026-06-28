import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// Basic accessibility sweep across key routes. Tag @a11y-smoke for selective runs.
const routes = ['/', '/about', '/projects'];

for (const route of routes) {
  test(`a11y smoke: ${route} @a11y-smoke`, async ({ page }) => {
    await page.goto(route);
    await page.waitForSelector('main');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const violations = results.violations.filter(v => !['color-contrast'].includes(v.id));
    // Allow contrast handled by token audit elsewhere; focus on structural issues.
    expect(violations, `Accessibility violations on ${route}`)
      .toEqual([]);
  });
}
