#!/usr/bin/env node
/**
 * Accessibility Trend Logger
 * Uses Playwright + @axe-core/playwright AxeBuilder to collect violation counts for core routes and appends to accessibility-history.json.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AxeBuilder } from '@axe-core/playwright';

const routes = ['/', '/about', '/projects'];
const base = process.env.BASE_URL || 'http://localhost:4321';
const historyFile = path.join(process.cwd(), 'accessibility-history.json');
const failOnViolation = process.env.A11Y_FAIL === 'true';
const maxPerRoute = process.env.A11Y_MAX_PER_ROUTE ? parseInt(process.env.A11Y_MAX_PER_ROUTE, 10) : undefined;
const maxTotal = process.env.A11Y_MAX_TOTAL ? parseInt(process.env.A11Y_MAX_TOTAL, 10) : undefined;

(async () => {
  const browser = await chromium.launch();
  const entry = { timestamp: new Date().toISOString(), pages: [], totals: { count: 0, byImpact: {} } };
  for (const r of routes) {
    const pageRecord = { route: r, violations: -1 };
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(base + r, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(()=>{});
      const analysis = await new AxeBuilder({ page }).include('body').analyze();
      const violations = analysis.violations || [];
      pageRecord.violations = violations.length;
      pageRecord.rules = violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
      // aggregate severity
      for (const v of violations) {
        const impact = v.impact || 'unknown';
        entry.totals.byImpact[impact] = (entry.totals.byImpact[impact] || 0) + 1;
        entry.totals.count += 1;
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
  const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile,'utf-8')) : [];
  history.push(entry);
  fs.writeFileSync(historyFile, JSON.stringify(history,null,2));
  console.log('[a11y:trend]', entry.pages.map(p=>`${p.route}:${p.violations}`).join(' '), '| totals:', entry.totals);
  // threshold-based gating takes precedence when provided
  if (typeof maxPerRoute === 'number' || typeof maxTotal === 'number') {
    let gateFail = false;
    if (typeof maxPerRoute === 'number') {
      const offending = entry.pages.filter(p => p.violations > maxPerRoute);
      if (offending.length > 0) {
        gateFail = true;
        console.warn(`[a11y:gate] per-route limit exceeded (> ${maxPerRoute})`, offending.map(o => `${o.route}:${o.violations}`).join(' '));
      }
    }
    if (typeof maxTotal === 'number' && entry.totals.count > maxTotal) {
      gateFail = true;
      console.warn(`[a11y:gate] total violations ${entry.totals.count} exceed max ${maxTotal}`);
    }
    if (gateFail) process.exitCode = 1;
  } else if (failOnViolation) {
    const hasViolations = entry.pages.some(p => p.violations > 0);
    if (hasViolations) process.exitCode = 1;
  }
})();
