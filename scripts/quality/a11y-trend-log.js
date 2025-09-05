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

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const entry = { timestamp: new Date().toISOString(), pages: [] };
  for (const r of routes) {
    const pageRecord = { route: r, violations: -1 };
    try {
      await page.goto(base + r, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(()=>{});
      const analysis = await new AxeBuilder({ page }).include('body').analyze();
      const violations = analysis.violations || [];
      pageRecord.violations = violations.length;
      pageRecord.rules = violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    } catch (e) {
      pageRecord.error = e.message;
      console.warn('[a11y:trend] route failed', r, e.message);
    }
    entry.pages.push(pageRecord);
  }
  await browser.close();
  const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile,'utf-8')) : [];
  history.push(entry);
  fs.writeFileSync(historyFile, JSON.stringify(history,null,2));
  console.log('[a11y:trend]', entry.pages.map(p=>`${p.route}:${p.violations}`).join(' '));
  if (failOnViolation) {
    const hasViolations = entry.pages.some(p => p.violations > 0);
    if (hasViolations) process.exitCode = 1;
  }
})();
