#!/usr/bin/env node
/**
 * Accessibility Trend Logger
 * Uses Playwright + @axe-core/playwright AxeBuilder to collect violation counts for core routes and appends to accessibility-history.json.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AxeBuilder } from '@axe-core/playwright';

// Route handling: explicit override via A11Y_ROUTES (comma or json array), otherwise auto-discover from dist HTML (top-level paths)
function parseRoutesEnv(val) {
  if (!val) return null;
  try {
    if (val.trim().startsWith('[')) return JSON.parse(val).map(String);
  } catch {
    /* fallback to comma parsing */
  }
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
function discoverRoutes() {
  const dist = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(dist)) return ['/'];
  const found = new Set(['/']);
  const stack = [dist];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name === 'index.html') {
        const rel = '/' + path.relative(dist, path.dirname(full)).replace(/\\/g, '/');
        found.add(rel === '/' ? '/' : rel.startsWith('/') ? rel : '/' + rel);
      }
    }
  }
  // basic prioritization: core pages first if present
  const coreOrder = ['/', '/about', '/projects', '/blog', '/contact'];
  const ordered = [
    ...coreOrder.filter((r) => found.has(r)),
    ...[...found].filter((r) => !coreOrder.includes(r)),
  ];
  return ordered.slice(0, 25); // cap to 25 to keep runtime bounded
}
const routes = parseRoutesEnv(process.env.A11Y_ROUTES) || discoverRoutes();
const base = process.env.BASE_URL || 'http://localhost:4321';
const historyFile = path.join(process.cwd(), 'accessibility-history.json');
const maxHistory = parseInt(process.env.A11Y_HISTORY_MAX || '50', 10); // rotate to avoid unbounded growth
// Block impacts: if any violation has an impact in this list => immediate gate fail
const blockImpacts = (process.env.A11Y_BLOCK_IMPACTS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
let blockedImpactFound = false;
const failOnViolation = process.env.A11Y_FAIL === 'true';
const maxPerRoute = process.env.A11Y_MAX_PER_ROUTE
  ? parseInt(process.env.A11Y_MAX_PER_ROUTE, 10)
  : undefined;
const maxTotal = process.env.A11Y_MAX_TOTAL ? parseInt(process.env.A11Y_MAX_TOTAL, 10) : undefined;
let maxByRoute;
if (process.env.A11Y_MAX_BY_ROUTE) {
  try {
    maxByRoute = JSON.parse(process.env.A11Y_MAX_BY_ROUTE);
  } catch (e) {
    console.warn('[a11y:gate] invalid A11Y_MAX_BY_ROUTE JSON, ignoring:', e.message);
  }
}

(async () => {
  const browser = await chromium.launch();
  const entry = {
    timestamp: new Date().toISOString(),
    pages: [],
    totals: { count: 0, byImpact: {} },
  };
  for (const r of routes) {
    const pageRecord = { route: r, violations: -1 };
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(base + r, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page
        .waitForFunction(
          () => globalThis.document?.documentElement?.getAttribute('data-theme') != null,
          null,
          { timeout: 5000 }
        )
        .catch(() => {});
      const analysis = await new AxeBuilder({ page }).include('body').analyze();
      const violations = analysis.violations || [];
      pageRecord.violations = violations.length;
      pageRecord.rules = violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
      }));
      // aggregate severity
      for (const v of violations) {
        const impact = v.impact || 'unknown';
        entry.totals.byImpact[impact] = (entry.totals.byImpact[impact] || 0) + 1;
        entry.totals.count += 1;
        if (
          !blockedImpactFound &&
          blockImpacts.length &&
          impact &&
          blockImpacts.includes(String(impact).toLowerCase())
        ) {
          blockedImpactFound = true;
        }
      }
    } catch (e) {
      pageRecord.error = e.message;
      console.warn('[a11y:trend] route failed', r, e.message);
    } finally {
      await context.close();
    }
    entry.pages.push(pageRecord);
  }
  await browser.close();
  const history = fs.existsSync(historyFile)
    ? JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
    : [];
  history.push(entry);
  if (history.length > maxHistory) history.splice(0, history.length - maxHistory);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  console.log(
    '[a11y:trend]',
    entry.pages.map((p) => `${p.route}:${p.violations}`).join(' '),
    '| totals:',
    entry.totals
  );
  // threshold-based gating takes precedence when provided
  if (blockedImpactFound) {
    console.warn('[a11y:gate] blocked impact category detected:', blockImpacts.join(','));
    process.exitCode = 1;
  } else if (maxByRoute || typeof maxPerRoute === 'number' || typeof maxTotal === 'number') {
    let gateFail = false;
    // per-route map takes precedence
    if (maxByRoute && typeof maxByRoute === 'object') {
      const offenders = [];
      for (const p of entry.pages) {
        const routeCap = maxByRoute[p.route];
        if (typeof routeCap === 'number' && p.violations > routeCap) {
          offenders.push(`${p.route}:${p.violations}(cap=${routeCap})`);
        }
      }
      if (offenders.length) {
        gateFail = true;
        console.warn('[a11y:gate] route caps exceeded', offenders.join(' '));
      }
    }
    // fallback to global per-route cap when present
    if (!gateFail && typeof maxPerRoute === 'number') {
      const offending = entry.pages.filter((p) => p.violations > maxPerRoute);
      if (offending.length > 0) {
        gateFail = true;
        console.warn(
          `[a11y:gate] per-route limit exceeded (> ${maxPerRoute})`,
          offending.map((o) => `${o.route}:${o.violations}`).join(' ')
        );
      }
    }
    if (typeof maxTotal === 'number' && entry.totals.count > maxTotal) {
      gateFail = true;
      console.warn(`[a11y:gate] total violations ${entry.totals.count} exceed max ${maxTotal}`);
    }
    if (gateFail) process.exitCode = 1;
  } else if (failOnViolation) {
    const hasViolations = entry.pages.some((p) => p.violations > 0);
    if (hasViolations) process.exitCode = 1;
  }
})();
