import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

// Core automated accessibility scan across key routes
// Tagged as essential but can be split later if performance issues arise.

const baselinePath = path.resolve(__dirname, '../../accessibility-baseline.json');

interface AxeViolationSummary { id: string; impact: string | null; nodes: number; }
interface AccessibilityBaseline { [route: string]: AxeViolationSummary[]; }

function loadBaseline(): AccessibilityBaseline | null {
  if (fs.existsSync(baselinePath)) {
    try {
      return JSON.parse(fs.readFileSync(baselinePath, 'utf-8')) as AccessibilityBaseline;
    } catch {
      console.warn('Failed to parse accessibility baseline, ignoring.');
    }
  }
  return null;
}

function serializeViolations(violations: any[]): AxeViolationSummary[] {
  return violations.map(v => ({ id: v.id, impact: v.impact || null, nodes: v.nodes?.length || 0 })).sort((a,b) => a.id.localeCompare(b.id));
}

test.describe('@essential @accessibility-core Axe Accessibility Scan', () => {
  const routes = ['/', '/about', '/projects', '/blog'];
  const baseline = loadBaseline();

  const updated: AccessibilityBaseline = baseline ? { ...baseline } : {};

  for (const route of routes) {
    test(`axe scan ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const serialized = serializeViolations(results.violations);

      if (!baseline) {
        // First run creates baseline (does not fail build)
        updated[route] = serialized;
      } else {
        const baseForRoute = baseline[route] || [];
        // Detect new violations not in baseline
        const newOnes = serialized.filter(v => !baseForRoute.find(b => b.id === v.id));
        if (newOnes.length) {
          console.log(`New accessibility violations on ${route}:`, newOnes.map(v => v.id).join(', '));
        }
        // Soft expect zero new violations
        expect.soft(newOnes.length, `New accessibility violations introduced on ${route}: ${newOnes.map(v=>v.id).join(', ')}`).toBe(0);
      }

      // Always assert main landmark present
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    });
  }

  test.afterAll(async () => {
    if (!baseline) {
      fs.writeFileSync(baselinePath, JSON.stringify(updated, null, 2));
      console.log(`Accessibility baseline written to ${baselinePath}`);
    }
  });
});
