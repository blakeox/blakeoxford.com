#!/usr/bin/env node
/**
 * Accessibility Trend Logger
 * Uses Playwright + axe-core to collect violation counts for core routes and appends to accessibility-history.json.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import axe from '@axe-core/playwright';

const routes = ['/', '/about', '/projects'];
const historyFile = path.join(process.cwd(), 'accessibility-history.json');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const entry = { timestamp: new Date().toISOString(), pages: [] };
  for (const r of routes) {
    try {
      await page.goto('http://localhost:4321' + r, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // small settle
      await page.waitForTimeout(200);
      const results = await axe.run(page, { resultTypes: ['violations'] });
      entry.pages.push({ route: r, violations: results.violations.length });
    } catch (e) {
      entry.pages.push({ route: r, violations: -1, error: e.message });
      console.warn('[a11y:trend] route failed', r, e.message);
    }
  }
  await browser.close();
  const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile,'utf-8')) : [];
  history.push(entry);
  fs.writeFileSync(historyFile, JSON.stringify(history,null,2));
  console.log('[a11y:trend] ' + entry.pages.map(p=>`${p.route}:${p.violations}`).join(' '));
})();
