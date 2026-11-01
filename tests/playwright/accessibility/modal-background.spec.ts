import { test, expect } from '../fixtures';

for (const width of [390, 1440]) {
  test(`Search isolates background and restores it after closing at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about/');
    const trigger = page.locator('#search-toggle');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await expect(page.locator('#footer')).toHaveAttribute('inert', '');
    await page
      .locator('main a[href="/contact/"]')
      .first()
      .evaluate((link: HTMLElement) => link.focus());
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert', '');
    await expect(page.locator('#footer')).not.toHaveAttribute('inert', '');
    await page
      .getByRole('link', { name: 'Read the study: Finance systems integration', exact: true })
      .click();
    await expect(page).toHaveURL(/\/projects\/adp-workforcenow\/$/);
    await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  });
}

test('mobile navigation isolates the reading surface and restores it on route change', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#nav-toggle').click();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('#footer')).toHaveAttribute('inert', '');
  await page.locator('#nav-mobile-links a[href="/about/"]').click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#footer')).not.toHaveAttribute('inert', '');
});

for (const width of [390, 1440]) {
  test(`Ask isolates only its mobile modal presentation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/blog/');
    await page.getByRole('button', { name: 'Open Ask' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ask' });
    await expect(dialog).toBeVisible();
    if (width < 640) await expect(page.locator('main')).toHaveAttribute('inert', '');
    else await expect(page.locator('main')).not.toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('main')).not.toHaveAttribute('inert', '');
    await expect(page.getByRole('button', { name: 'Open Ask' })).toBeFocused();
  });
}

test('timeline study links have distinct contextual names', async ({ page }) => {
  await page.goto('/about/');
  const links = page.getByRole('link', { name: /^Read the study:/ });
  await expect(links).toHaveCount(5);
  const names = await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('aria-label'))
  );
  expect(new Set(names).size).toBe(5);
});

test('contact errors describe the invalid field and preserve correction context', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__AUDIT__ = true;
  });
  await page.route('**/send-email', () => {
    throw new Error('Validation must not send a request');
  });
  await page.goto('/contact/');
  await expect(page.locator('#turnstile-shell')).toHaveAttribute('data-turnstile-state', 'audit');
  await page.getByRole('button', { name: 'Send project brief' }).click();
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription(/required/);
  await name.fill('Accessibility test');
  await name.blur();
  await expect(name).toHaveAttribute('aria-invalid', 'false');
});

for (const width of [320, 390, 768]) {
  test(`200 percent default text reflows and retains navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      window.__AUDIT__ = true;
    });
    for (const path of [
      '/',
      '/about/',
      '/projects/',
      '/blog/',
      '/contact/',
      '/blog/building-my-own-local-llm-stack/',
    ]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px';
      });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        path
      ).toBeLessThanOrEqual(width + 1);
      const toggle = page.locator('#nav-toggle');
      await expect(toggle).toBeVisible();
      const rect = (await toggle.boundingBox())!;
      expect(rect.x + rect.width).toBeLessThanOrEqual(width);
      expect(rect.width).toBeGreaterThanOrEqual(44);
      await toggle.click();
      await expect(page.locator('#nav-mobile-links')).toHaveAttribute('data-state', 'open');
      await page.keyboard.press('Escape');
      await expect(toggle).toBeFocused();
      await expect(page.locator('main')).not.toHaveAttribute('inert', '');
    }
  });
}
