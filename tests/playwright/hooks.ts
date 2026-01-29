import { test } from '@playwright/test';

// Global hooks: capture client-side logs and attach diagnostics when a test fails
// so traces contain our in-page instrumentation even if Playwright closes the page.

test.beforeEach(async ({ page }) => {
  // Inject client-side console capture early so any page script logs are preserved
  await page.addInitScript(() => {
    try {
      (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE = (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE || [];
      const wrapConsole = (level: any) => {
        const orig = console[level];
        // @ts-ignore
        console[level] = function (...args: any[]) {
          try {
            const serialized = args.map(a => {
              try {
                if (a instanceof Error) return a.stack || a.message;
                if (typeof a === 'object') return JSON.stringify(a);
              } catch (e) {}
              return String(a);
            });
            try { (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE.push({ level, args: serialized, ts: Date.now() }); } catch (e) {}
          } catch (e) {}
          try { orig && orig.apply && orig.apply(console, args); } catch (e) {}
        };
      };
      ['log','warn','error','info','debug'].forEach(wrapConsole as any);
    } catch (e) { /* noop */ }
  });

  // Node-side console capture for messages emitted by the page
  (page as any)._consoleCapture = [];
  page.on('console', (msg) => {
    try {
      const loc = msg.location ? msg.location() : undefined;
      (page as any)._consoleCapture.push({ type: msg.type(), text: msg.text(), location: loc });
    } catch (e) { /* noop */ }
  });
});

test.afterEach(async ({ page }, testInfo) => {
  // Only attach heavy artifacts on failure to reduce noise
  if (testInfo.status !== 'passed') {
    try {
      const data = await page.evaluate(() => (window as any).__TEST_EVENT_LOG || []);
      await testInfo.attach('client-test-event-log.json', { body: JSON.stringify(data), contentType: 'application/json' });
    } catch (e) { /* noop */ }

    try {
      const captured = await page.evaluate(() => (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE || []);
      await testInfo.attach('client-console.json', { body: JSON.stringify(captured), contentType: 'application/json' });
    } catch (e) { /* noop */ }

    try {
      const nodeConsole = (page as any)._consoleCapture || [];
      await testInfo.attach('node-console.json', { body: JSON.stringify(nodeConsole), contentType: 'application/json' });
    } catch (e) { /* noop */ }

    try {
      const html = await page.content();
      await testInfo.attach('page-content.html', { body: html, contentType: 'text/html' });
    } catch (e) { /* noop */ }

    // Try to include a screenshot if possible (may be disabled in config)
    try {
      const buffer = await page.screenshot({ fullPage: false }).catch(() => null);
      if (buffer) {
        await testInfo.attach('screenshot.png', { body: buffer, contentType: 'image/png' });
      }
    } catch (e) { /* noop */ }
  }
});
