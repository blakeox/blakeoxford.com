import { test, expect } from './fixtures';

for (const [width, height] of [
  [390, 844],
  [1440, 900],
]) {
  test(`work library connects project evidence to the AI conversation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/projects/');
    const hero = page.locator('#projects-hero');
    await expect(
      hero.getByRole('heading', { name: 'Foundations for enterprise AI', exact: true })
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
    const lastVisibleStudy = studies.nth(width === 1440 ? 1 : 0);
    await expect(lastVisibleStudy).toBeInViewport({ ratio: 1 });
    const migration = page.getByRole('link', { name: 'Microsoft 365 migration', exact: true });
    await expect(migration).toHaveAttribute('href', '/projects/google-workspace-migration/');
    await expect(migration).toContainText('99.99% uptime through the remote cutover');
    await migration.click();
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
