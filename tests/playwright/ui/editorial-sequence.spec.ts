import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

for (const theme of ['light', 'dark']) {
  test(`writing has one lead and complete, distinct archive in ${theme} @essential`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.goto('/blog/');
    const response = await page.request.get('/search/blog.json');
    expect(response.ok()).toBe(true);
    const published = (
      (await response.json()) as Array<{
        slug: string;
        title: string;
        publishedAt: string;
        draft?: boolean;
      }>
    )
      .filter((post) => !post.draft)
      .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());
    const feature = page.locator('[data-featured-article]');
    if (published.length === 0) {
      await expect(feature).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: 'Articles are on the way', exact: true })
      ).toBeVisible();
      return;
    }
    await expect(feature).toHaveCount(1);
    await expect(feature.getByRole('heading', { level: 2 })).toHaveText(published[0].title);
    await expect(feature.locator('time')).toHaveAttribute(
      'datetime',
      new Date(published[0].publishedAt).toISOString()
    );
    const archiveHeading = page.getByRole('heading', { name: 'More writing', exact: true });
    if (published.length > 1) await expect(archiveHeading).toBeVisible();
    else await expect(archiveHeading).toHaveCount(0);
    const links = await page
      .locator('main article > a')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(links).toEqual(published.map((post) => `/blog/${post.slug}/`));
    await expect(page.locator('main article h3')).toHaveCount(published.length - 1);
    await feature.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => url.pathname === `/blog/${published[0].slug}/`);
    await page.getByRole('link', { name: 'All writing', exact: true }).click();
    await expect(feature).toBeVisible();
    await page.goto('/blog/ethics-in-the-ai-age-semcacfe/');
    const photo = page.locator('main > header figure img');
    await expect(photo).toHaveAttribute(
      'alt',
      'A speaker beside a presentation slide at Ethics in the AI Age'
    );
    await page.goto('/blog/ces-2026-ai-has-left-the-screen/');
    await expect(page.locator('main > header figure img')).toHaveAttribute(
      'alt',
      'Three attendees beside the CES sign'
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      'Three attendees beside the CES sign'
    );
  });

  test(`alternate contact actions remain clear at enlarged text in ${theme} @essential`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript((value) => {
      window.__AUDIT__ = true;
      localStorage.setItem('theme', value);
    }, theme);
    await page.goto('/contact/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const channels = page.getByRole('region', { name: 'Connect directly', exact: true });
    const email = channels.getByRole('link', { name: /Send email/ });
    const phone = channels.getByRole('link', { name: /Call Blake/ });
    const profile = channels.getByRole('link', { name: /View profile/ });
    await expect(email).toHaveAttribute('href', 'mailto:blakepoxford@outlook.com');
    await expect(phone).toHaveAttribute('href', 'tel:2482024479');
    await expect(profile).toHaveAttribute('target', '_blank');
    await expect(profile).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(profile).toHaveAccessibleName(/opens in a new tab/);
    for (const link of [email, phone, profile]) {
      await link.focus();
      await expect(link).toBeFocused();
      const bounds = await link.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    const audit = await new AxeBuilder({ page })
      .include('section[aria-labelledby="contact-channels-heading"]')
      .analyze();
    expect(audit.violations).toEqual([]);
    const names = await new AxeBuilder({ page })
      .include('section[aria-labelledby="contact-channels-heading"]')
      .withRules(['label-content-name-mismatch'])
      .analyze();
    expect(names.violations).toEqual([]);
  });
}
