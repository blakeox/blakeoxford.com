import { devices } from '@playwright/test';
import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  for (const path of ['/', '/blog/']) {
    for (const activation of ['pointer', 'keyboard', 'cancel']) {
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
        let delayed = 0;
        await page.route('**/_astro/**', async (route) => {
          if (new URL(route.request().url()).pathname.endsWith('.js')) {
            delayed++;
            await modules;
          }
          await route.continue();
        });
        try {
          await page.goto(new URL(path, baseURL).href, { waitUntil: 'commit' });
          await expect(page.locator('#navbar')).toHaveAttribute('data-js-nav', 'true');
          await expect(page.locator('main h1')).toBeVisible();
          const trigger = page.getByRole('button', { name: 'Search', exact: true });
          if (activation === 'keyboard') {
            await trigger.focus();
            await page.keyboard.press('Enter');
          } else if (width < 768) await trigger.tap();
          else await trigger.click();
          if (activation === 'cancel') await page.keyboard.press('Escape');
          expect(delayed).toBeGreaterThan(0);
          release();
          await page.waitForLoadState('load');
          if (activation === 'cancel') {
            await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeHidden();
            if (width < 768) await trigger.tap();
            else await trigger.click();
          }
          await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeVisible();
          await expect(page.getByRole('combobox')).toBeFocused();
          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
          await expect(page.locator('main')).not.toHaveAttribute('inert', '');
          if (width < 768) await trigger.tap();
          else await trigger.click();
          await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
        } finally {
          release();
          await context.close();
        }
      });
    }
  }
}
