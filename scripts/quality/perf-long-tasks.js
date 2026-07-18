#!/usr/bin/env node
/**
 * Long Task Budget Probe
 * Uses Playwright to navigate key routes and gather PerformanceLongTaskTiming entries via performance observer.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';

const routes = ['/', '/about', '/projects'];
const base = process.env.BASE_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const report = [];
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' }).catch(() => {});
    // Inject observer
    await page.addInitScript(() => {
      // eslint-disable-next-line no-undef
      window.__longTasks = [];
      // eslint-disable-next-line no-undef
      new PerformanceObserver((list) => {
        // eslint-disable-next-line no-undef
        list
          .getEntries()
          .forEach((e) =>
            window.__longTasks.push({ name: e.name, start: e.startTime, duration: e.duration })
          );
      }).observe({ type: 'longtask', buffered: true });
    });
    // small wait to allow tasks; alternative is networkidle but SSG should be fast
    await page.waitForTimeout(500);
    // eslint-disable-next-line no-undef
    const tasks = await page.evaluate(() => window.__longTasks || []);
    const over50 = tasks.filter((t) => t.duration > 50);
    report.push({
      route,
      total: tasks.length,
      over50: over50.length,
      max: tasks.reduce((m, t) => Math.max(m, t.duration), 0) || 0,
    });
  }
  await browser.close();
  fs.writeFileSync('long-tasks-report.json', JSON.stringify(report, null, 2));
  console.log(
    '[longtasks] ' +
      report.map((r) => `${r.route}:>${r.over50} max=${r.max.toFixed(1)}`).join(' | ')
  );
})();
