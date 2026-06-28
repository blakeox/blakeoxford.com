import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import { resolveFrom } from '../../utils/esmPath.js';

// Core automated accessibility scan across key routes
// Tagged as essential but can be split later if performance issues arise.

// In ESM there is no __dirname; use resolveFrom helper. Baseline at tests/accessibility-baseline.json
const baselinePath = resolveFrom(import.meta, '..', '..', 'accessibility-baseline.json');

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

      // Filter known false-positive color-contrast nodes within allowed containers
      // Apply to all routes with safeguards: we only remove nodes inside explicit
      // [data-a11y-allow-color-contrast] containers and/or suppress the violation
      // if ALL remaining nodes meet WCAG AA thresholds using computed contrast.
      {
        const ccIndex = results.violations.findIndex(v => v.id === 'color-contrast');
        if (ccIndex >= 0) {
          const v = results.violations[ccIndex];
          try {
            // For each node, determine in the page context whether its first target element
            // (or any target) is inside the allowed container marked with the data attribute.
            const nodeTargets: (string | null)[] = v.nodes.map(n => {
              const raw: any[] = (n.target || []).filter(Boolean);
              if (!raw.length) return null;
              const first = raw[0];
              return typeof first === 'string' ? first : Array.isArray(first) ? first.join(' ') : String(first);
            });
            const insideFlags = await page.evaluate((selectors) => {
              return selectors.map(sel => {
                if (!sel) return false;
                // Query ALL possible elements for selector (there can be multiple if selector is generic)
                const els = Array.from(document.querySelectorAll(sel));
                if (!els.length) return false; // if we can't find it, keep it (conservative)
                return els.every(el => el.closest('[data-a11y-allow-color-contrast]'));
              });
            }, nodeTargets);

            const before = v.nodes.length;
            v.nodes = v.nodes.filter((_, idx) => !insideFlags[idx]);
            const removed = before - v.nodes.length;
            if (removed > 0) {
              console.log(`[a11y-filter] Removed ${removed} false-positive color-contrast nodes inside [data-a11y-allow-color-contrast] container`);
            }

            // Secondary safeguard: compute actual contrast ratios for any remaining nodes and
            // drop the violation entirely if all remaining nodes meet WCAG AA thresholds.
            if (v.nodes.length > 0) {
              const remainingSelectors = v.nodes.map(n => {
                const raw: any[] = (n.target || []).filter(Boolean);
                if (!raw.length) return null;
                const first = raw[0];
                return typeof first === 'string' ? first : Array.isArray(first) ? first.join(' ') : String(first);
              }).filter(Boolean) as string[];
              try {
                const ratioInfo = await page.evaluate((selectors) => {
                  function parseRGB(str: string) {
                    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
                    if (!m) return null;
                    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
                  }
                  function relLum(c: {r:number;g:number;b:number}) {
                    const conv = [c.r,c.g,c.b].map(v=>{const x=v/255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);});
                    return 0.2126*conv[0]+0.7152*conv[1]+0.0722*conv[2];
                  }
                  function contrast(fg:any,bg:any){const L1=relLum(fg);const L2=relLum(bg);const lighter=Math.max(L1,L2);const darker=Math.min(L1,L2);return (lighter+0.05)/(darker+0.05);}
                  function effectiveBg(el: HTMLElement | null){
                    while(el){const cs=getComputedStyle(el);const m=parseRGB(cs.backgroundColor);if(m && m.a>0 && !(m.r===0&&m.g===0&&m.b===0&&m.a===0)) return m; el=el.parentElement; }
                    return {r:255,g:255,b:255,a:1};
                  }
                  return selectors.map(sel => {
                    const el = document.querySelector(sel) as HTMLElement | null;
                    if(!el) return null;
                    const cs = getComputedStyle(el);
                    const fg = parseRGB(cs.color); if(!fg) return null;
                    const bg = effectiveBg(el);
                    const ratio = contrast(fg,bg);
                    const fontSize = parseFloat(cs.fontSize || '16');
                    const fontWeight = parseInt(cs.fontWeight || '400',10);
                    const isLarge = (fontSize >= 24) || (fontSize >= 18.66 && fontWeight >= 700);
                    return { sel, ratio, isLarge };
                  }).filter(Boolean);
                }, remainingSelectors);
                const allPass = (ratioInfo as any[]).every(r => r.ratio >= (r.isLarge ? 3 : 4.5));
                if (allPass) {
                  console.log('[a11y-filter] All remaining color-contrast nodes meet WCAG thresholds; suppressing violation as false positive.');
                  results.violations.splice(ccIndex, 1);
                }
              } catch (e) {
                console.log('[a11y-filter] Ratio verification error:', (e as Error).message);
              }
            }
            if (v.nodes.length === 0) {
              results.violations.splice(ccIndex, 1);
              console.log('[a11y-filter] Removed color-contrast violation entirely (only contained false positives).');
            }
          } catch (e) {
            console.log('[a11y-filter] Filtering error:', (e as Error).message);
          }
        }
      }

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
