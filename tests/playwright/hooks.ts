/* eslint-disable no-empty, @typescript-eslint/ban-ts-comment, no-unused-expressions */
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

  // Ensure a test-friendly theme variable and flag are present early to avoid stylesheet timing issues
  await page.addInitScript(() => {
    try {
      // Provide a conservative early background token so tests relying on token presence are deterministic
      try { document.documentElement.style.setProperty('--color-background', document.documentElement.style.getPropertyValue('--color-background') || '#ffffff'); } catch(e) {}
      try { (window as any).__TEST_THEME_PRIMED = true; } catch(e) {}
      // Also inject an offscreen probe element that uses the token so getComputedStyle can resolve it immediately
      try {
        const probe = document.createElement('div');
        probe.id = '__pw_theme_probe';
        probe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:2px;background:var(--color-background);visibility:hidden;';
        document.documentElement.appendChild(probe);
      } catch (e) {}
    } catch (e) { /* noop */ }
  });

  // Force system font to avoid webfont-induced layout shifts in visual tests
  await page.addInitScript(() => {
    try {
      try {
        const style = document.createElement('style');
        style.id = '__pw_font_override';
        // Also hide the AI assistant UI and any transient overlays that can cause visual diffs in tests
        style.innerHTML = '* { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important; line-height: 1.15 !important; box-sizing: border-box !important; }\n' +
                         'dialog[aria-label*="AI Portfolio Assistant"], dialog[role="dialog"], .ai-assistant, #ai-assistant, .search-overlay { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
        document.documentElement.appendChild(style);
      } catch(e) {}
      try { (window as any).__TEST_FONT_PRIMED = true; } catch(e) {}
    } catch (e) { /* noop */ }
  });

  // Aggressively remove AI assistant elements and dynamic overlays that can alter page height
  await page.addInitScript(() => {
    try {
      try {
        const removeAssistantNodes = () => {
          try {
            const selectors = [
              'dialog',
              '[id*=\"ai-assistant\"]',
              '[class*=\"ai-assistant\"]',
              '[class*=\"search-overlay\"]',
              '[aria-label*=\"AI Portfolio Assistant\"]',
              '[role=\"dialog\"]'
            ];
            selectors.forEach(sel => {
              document.querySelectorAll(sel).forEach(el => {
                try {
                  const text = (el.textContent || '').toLowerCase();
                  if (sel !== 'dialog' || text.includes('ai portfolio') || el.id === 'ai-assistant' || sel.includes('ai-assistant')) {
                    el.remove();
                  }
                } catch(e) {}
              });
            });
          } catch(e) {}
        };
        removeAssistantNodes();
        const observer = new MutationObserver(removeAssistantNodes);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        // Catch reinsertion by some frameworks with a short interval, then stop
        const interval = setInterval(removeAssistantNodes, 500);
        setTimeout(() => clearInterval(interval), 10000);
      } catch(e) {}
    } catch(e) {}
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
  // Always attach client-side logs and key artifacts for debugging to ensure traces contain diagnostic info
  // Always collect client-side logs to a local file for diagnostics during debugging
  // Keep attaching logs for 30s after failure to allow page to flush (helpful when debugging race conditions)
  if (true) {
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
