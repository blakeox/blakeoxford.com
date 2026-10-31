import { test, expect } from './fixtures';

for (const width of [390, 1440]) {
  test(`work library connects project evidence to the AI conversation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/projects/');
    const hero = page.locator('#projects-hero');
    await expect(hero.getByRole('heading', { name: 'Selected work', exact: true })).toBeVisible();
    await expect(hero).toContainText('navigate AI');
    const categories = hero.getByRole('navigation', { name: 'Project categories' });
    for (const link of await categories.getByRole('link').all()) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^#/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
    const heading = await hero.getByRole('heading', { level: 1 }).boundingBox();
    const navigation = await page
      .getByRole('navigation', { name: 'Main Navigation' })
      .boundingBox();
    expect(heading!.y).toBeGreaterThanOrEqual(navigation!.y + navigation!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    await page.locator('[data-cta-id="study_cta"]').first().click();
    await expect(
      page.getByRole('heading', { name: 'From this work to enterprise AI', exact: true })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Discuss your bottleneck', exact: true }).last().click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(
      page.getByRole('heading', { name: 'Turn your AI bottleneck into a plan' })
    ).toBeVisible();
  });
}
