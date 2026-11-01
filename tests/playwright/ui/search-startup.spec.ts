import { devices } from '@playwright/test';
import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  for (const path of ['/', '/blog/']) {
    for (const activation of ['pointer', 'keyboard', 'cancel', 'cancel-mount']) {
      test(`first Search ${activation} survives delayed scripts at ${width}px on ${path} @essential`, async ({
        browser,
        browserName,
        baseURL,
      }) => {
        const {
          defaultBrowserType: _defaultBrowserType,
          isMobile,
          ...phone
        } = devices[browserName === 'webkit' ? 'iPhone 13' : 'Pixel 7'];
        const context = await browser.newContext({
          ...(width < 768 ? { ...phone, ...(browserName === 'firefox' ? {} : { isMobile }) } : {}),
          viewport: { width, height: 900 },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        let release!: () => void;
        const modules = new Promise<void>((resolve) => {
          release = resolve;
        });
        let releaseSurface!: () => void;
        const surface = new Promise<void>((resolve) => {
          releaseSurface = resolve;
        });
        let delayed = 0;
        let delayedSurface = 0;
        await page.route('**/_astro/**', async (route) => {
          const pathname = new URL(route.request().url()).pathname;
          if (pathname.endsWith('.js')) {
            if (activation === 'cancel-mount' && pathname.includes('/commandCenterLoader.')) {
              delayedSurface++;
              await surface;
            } else {
              delayed++;
              await modules;
            }
          }
          await route.continue();
        });
        try {
          await page.goto(new URL(path, baseURL).href, { waitUntil: 'commit' });
          await expect(page.locator('#navbar')).toHaveAttribute('data-js-nav', 'true');
          await expect(page.locator('main h1')).toBeVisible();
          const trigger = page.getByRole('button', { name: 'Search', exact: true });
          const readFocus = () =>
            page.evaluate(() => ({
              tag: document.activeElement?.tagName,
              id: document.activeElement?.id,
            }));
          let canceledFocus: Awaited<ReturnType<typeof readFocus>> | undefined;
          if (activation === 'keyboard') {
            await trigger.focus();
            await page.keyboard.press('Enter');
          } else if (width < 768) await trigger.tap();
          else await trigger.click();
          if (activation === 'cancel') {
            canceledFocus = await readFocus();
            await page.keyboard.press('Escape');
          }
          expect(delayed).toBeGreaterThan(0);
          release();
          if (activation === 'cancel-mount') {
            await expect.poll(() => delayedSurface).toBeGreaterThan(0);
            await expect
              .poll(() => page.evaluate(() => document.documentElement.style.overflow))
              .toBe('hidden');
            canceledFocus = await readFocus();
            await page.keyboard.press('Escape');
            await expect
              .poll(() => page.evaluate(() => document.documentElement.style.overflow))
              .not.toBe('hidden');
            releaseSurface();
            await expect(page.locator('#search-overlay')).toHaveAttribute('data-ready', 'true');
          }
          await page.waitForLoadState('load');
          if (activation === 'cancel' || activation === 'cancel-mount') {
            await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeHidden();
            await expect.poll(readFocus).toEqual(canceledFocus);
            if (width < 768) await trigger.tap();
            else await trigger.click();
          }
          await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeVisible();
          await expect(page.getByRole('combobox')).toBeFocused();
          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
          await expect(page.locator('main')).not.toHaveAttribute('inert', '');
          await page.evaluate(() => {
            const win = window as Window & {
              __searchOpenEvents?: Array<{ event: string; source?: unknown }>;
              zaraz?: { track: (event: string, props?: Record<string, unknown>) => void };
            };
            win.__searchOpenEvents = [];
            win.zaraz = {
              track: (event, props) => {
                if (event === 'command_center_open') {
                  win.__searchOpenEvents?.push({ event, source: props?.source });
                }
              },
            };
          });
          if (width < 768) await trigger.tap();
          else await trigger.click();
          await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeVisible();
          await expect
            .poll(() =>
              page.evaluate(
                () => (window as Window & { __searchOpenEvents?: unknown[] }).__searchOpenEvents
              )
            )
            .toEqual([{ event: 'command_center_open', source: 'nav' }]);
          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
        } finally {
          release();
          releaseSurface();
          await context.close();
        }
      });
    }
  }
}
