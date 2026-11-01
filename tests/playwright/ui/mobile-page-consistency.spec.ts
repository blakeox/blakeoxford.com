import { test, expect } from '../fixtures';

test.use({ hasTouch: true, isMobile: true });

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`article reading space and return navigation at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      for (const slug of [
        'ai-statistics-future-decision-making',
        'building-my-own-local-llm-stack',
      ]) {
        await page.goto(`/blog/${slug}/`);
        await page.evaluate(() => document.fonts.ready);
        const measurements = await page
          .locator('[data-content-band-variant]')
          .evaluateAll((bands) =>
            bands.map((band) => {
              const style = getComputedStyle(band);
              return (
                band.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
              );
            })
          );
        expect(measurements.length).toBeGreaterThan(0);
        // Nested statement panels must retain a usable reading column on a small phone.
        expect(Math.min(...measurements)).toBeGreaterThanOrEqual(width - 140);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width + 1
        );
        const back = page.getByRole('link', { name: 'All writing', exact: true });
        expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await page.getByRole('link', { name: 'All writing', exact: true }).click();
      await expect(page).toHaveURL(/\/blog\/$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notes on navigating AI');
    });
  }
}

test('short landscape menu owns the screen and keeps Contact reachable', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 300 });
  await page.addInitScript(() => {
    window.__AUDIT__ = true;
  });
  await page.goto('/blog/');
  const launcher = page.locator('[data-ai-launcher]');
  await expect(launcher).toBeVisible();
  await page.locator('#nav-toggle').click();
  const menu = page.locator('#nav-mobile-links');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(launcher).toBeHidden();
  const paint = await menu.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return {
      alpha: context.getImageData(0, 0, 1, 1).data[3],
      bottom: element.getBoundingClientRect().bottom,
    };
  });
  expect(paint.alpha).toBe(255);
  expect(paint.bottom).toBeLessThanOrEqual(300);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('data-state', 'closed');
  await expect(page.locator('#nav-toggle')).toBeFocused();
  await expect(launcher).toBeVisible();
  await page.locator('#nav-toggle').click();
  const contact = menu.locator('a[href="/contact/"]');
  await contact.scrollIntoViewIfNeeded();
  expect(
    (await contact.boundingBox())!.y + (await contact.boundingBox())!.height
  ).toBeLessThanOrEqual(300);
  await contact.click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Turn your AI bottleneck into a plan'
  );
  await expect(page.locator('#nav-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('case-study proof and return link share the mobile reading gutter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/adp-workforcenow/');
  const title = page.getByRole('heading', { level: 1 });
  const proof = page.locator('.project-hero-proof .proof-plaque > p').first();
  expect(Math.abs((await title.boundingBox())!.x - (await proof.boundingBox())!.x)).toBeLessThan(1);
  const back = page.getByRole('link', { name: 'Back to selected work' });
  expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await back.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Selected work');
});

test('larger default text keeps mobile navigation within reach across pages', async ({ page }) => {
  await page.addInitScript(() => {
    window.__AUDIT__ = true;
  });
  await page.setViewportSize({ width: 320, height: 844 });
  for (const path of [
    '/',
    '/about/',
    '/projects/',
    '/blog/',
    '/contact/',
    '/blog/building-my-own-local-llm-stack/',
  ]) {
    await page.goto(path);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
    });
    const buttons = await page.locator('#navbar .nav-utility-button').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      })
    );
    for (const rect of buttons) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(320);
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    await expect(
      page.locator('#navbar').getByRole('link', { name: 'Blake Oxford', exact: true })
    ).toBeVisible();
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'open');
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-toggle')).toBeFocused();
  }
});
