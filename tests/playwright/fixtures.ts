import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';

const testOverridesCss = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/test-overrides.css'),
  'utf8',
);

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await page.addInitScript({
      path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../utils/colorResolver.browser.js'),
    });

    await page.addInitScript((css: string) => {
      try {
        if (document.getElementById('__pw_test_overrides')) return;
        const style = document.createElement('style');
        style.id = '__pw_test_overrides';
        style.textContent = css;
        document.documentElement.appendChild(style);
      } catch {
        /* noop */
      }
    }, testOverridesCss);

    await page.addInitScript(() => {
      try {
        (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE = (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE || [];
        const wrapConsole = (level: string) => {
          const orig = console[level as keyof Console] as (...args: unknown[]) => void;
          // @ts-expect-error console index assignment
          console[level] = function (...args: unknown[]) {
            try {
              const serialized = args.map((a) => {
                try {
                  if (a instanceof Error) return a.stack || a.message;
                  if (typeof a === 'object') return JSON.stringify(a);
                } catch {
                  void 0;
                }
                return String(a);
              });
              try {
                (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE.push({ level, args: serialized, ts: Date.now() });
              } catch {
                void 0;
              }
            } catch {
              void 0;
            }
            try {
              if (orig?.apply) orig.apply(console, args);
            } catch {
              void 0;
            }
          };
        };
        ['log', 'warn', 'error', 'info', 'debug'].forEach(wrapConsole);
      } catch {
        /* noop */
      }
    });

    await page.addInitScript(() => {
      try {
        (window as any).__TEST_THEME_PRIMED = true;
      } catch {
        void 0;
      }
    });

    await page.addInitScript(() => {
      try {
        const style = document.createElement('style');
        style.id = '__pw_font_override';
        style.innerHTML =
          '* { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial !important; line-height: 1.15 !important; box-sizing: border-box !important; }\n' +
          'dialog[aria-label*="AI Portfolio Assistant"], dialog[role="dialog"], .ai-assistant, #ai-assistant, .search-overlay { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
        document.documentElement.appendChild(style);
        try {
          (window as any).__TEST_FONT_PRIMED = true;
        } catch {
          void 0;
        }
      } catch {
        /* noop */
      }
    });

    await page.addInitScript(() => {
      try {
        const removeAssistantNodes = () => {
          try {
            const selectors = [
              'dialog',
              '[id*="ai-assistant"]',
              '[class*="ai-assistant"]',
              '[class*="search-overlay"]',
              '[aria-label*="AI Portfolio Assistant"]',
              '[role="dialog"]',
            ];
            selectors.forEach((sel) => {
              document.querySelectorAll(sel).forEach((el) => {
                try {
                  if (
                    el.id === 'nav-mobile-links' ||
                    el.id === 'search-overlay' ||
                    el.closest('#search-overlay')
                  ) {
                    return;
                  }
                  const text = (el.textContent || '').toLowerCase();
                  if (
                    sel !== 'dialog' ||
                    text.includes('ai portfolio') ||
                    el.id === 'ai-assistant' ||
                    sel.includes('ai-assistant')
                  ) {
                    el.remove();
                  }
                } catch {
                  void 0;
                }
              });
            });
          } catch {
            void 0;
          }
        };
        removeAssistantNodes();
        const observer = new MutationObserver(removeAssistantNodes);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        const interval = setInterval(removeAssistantNodes, 500);
        setTimeout(() => clearInterval(interval), 10000);
      } catch {
        void 0;
      }
    });

    (page as any)._consoleCapture = [];
    page.on('console', (msg) => {
      try {
        const loc = msg.location ? msg.location() : undefined;
        (page as any)._consoleCapture.push({ type: msg.type(), text: msg.text(), location: loc });
      } catch {
        /* noop */
      }
    });

    await use(page);

    try {
      const data = await page.evaluate(() => (window as any).__TEST_EVENT_LOG || []);
      await testInfo.attach('client-test-event-log.json', { body: JSON.stringify(data), contentType: 'application/json' });
    } catch {
      void 0;
    }

    try {
      const captured = await page.evaluate(() => (window as any).__PLAYWRIGHT_CONSOLE_CAPTURE || []);
      await testInfo.attach('client-console.json', { body: JSON.stringify(captured), contentType: 'application/json' });
    } catch {
      void 0;
    }

    try {
      const nodeConsole = (page as any)._consoleCapture || [];
      await testInfo.attach('node-console.json', { body: JSON.stringify(nodeConsole), contentType: 'application/json' });
    } catch {
      void 0;
    }

    try {
      const html = await page.content();
      await testInfo.attach('page-content.html', { body: html, contentType: 'text/html' });
    } catch {
      void 0;
    }

    try {
      const buffer = await page.screenshot({ fullPage: false }).catch(() => null);
      if (buffer) {
        await testInfo.attach('screenshot.png', { body: buffer, contentType: 'image/png' });
      }
    } catch {
      void 0;
    }
  },
});

export { expect };
