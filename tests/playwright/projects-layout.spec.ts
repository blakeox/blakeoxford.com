import { test, expect } from './fixtures';

for (const [width, height] of [
  [390, 844],
  [768, 900],
  [1024, 768],
  [1440, 900],
]) {
  test(`work library connects project evidence to the AI conversation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/');
    const hero = page.locator('#projects-hero');
    await expect(
      hero.getByRole('heading', { name: 'Selected case studies', exact: true })
    ).toBeVisible();
    await expect(hero).toContainText('practical AI adoption');
    const categories = hero.getByRole('navigation', { name: 'Project categories' });
    const anchors = ['#migrations', '#automation', '#decisions', '#also'];
    await expect(categories.getByRole('link')).toHaveCount(anchors.length);
    for (const [index, anchor] of anchors.entries()) {
      await expect(categories.getByRole('link').nth(index)).toHaveAttribute('href', anchor);
      await expect(page.locator(anchor)).toHaveCount(1);
    }
    const heading = await hero.getByRole('heading', { level: 1 }).boundingBox();
    const navigation = await page
      .getByRole('navigation', { name: 'Main Navigation' })
      .boundingBox();
    expect(heading!.y).toBeGreaterThanOrEqual(navigation!.y + navigation!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    const studies = page.locator('[data-cta-id="study_cta"]');
    await expect(studies).toHaveCount(8);
    await expect(studies.nth(1)).toBeInViewport({ ratio: 1 });
    const migration = page.getByRole('link', { name: 'Microsoft 365 migration', exact: true });
    await expect(migration).toHaveAttribute('href', '/projects/google-workspace-migration/');
    await expect(migration).toContainText('99.99% uptime through the remote cutover');
    for (const [index, anchor] of anchors.entries()) {
      await categories.getByRole('link').nth(index).focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${anchor}$`));
      const category = page.locator(anchor);
      const categoryHeading = category.getByRole('heading', { level: 2 });
      await expect(categoryHeading).toBeInViewport({ ratio: 1 });
      const categoryBox = await categoryHeading.boundingBox();
      expect(categoryBox!.y).toBeGreaterThanOrEqual(navigation!.y + navigation!.height);
      await page.keyboard.press('Tab');
      const firstStudy = category.getByRole('link').first();
      await expect(firstStudy).toBeFocused();
      await expect(firstStudy).toHaveCSS('outline-style', 'solid');
    }

    const contact = page.getByRole('region', { name: 'Talk about your project' });
    await expect(contact.getByRole('link')).toHaveCount(1);
    await expect(contact.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute(
      'href',
      '/contact/'
    );

    await migration.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'From this work to AI in production', exact: true })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Discuss your bottleneck', exact: true }).last().click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(
      page.getByRole('heading', { name: 'Turn your AI bottleneck into a plan' })
    ).toBeVisible();
  });
}
