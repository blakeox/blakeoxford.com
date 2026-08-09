import { test, expect } from './fixtures';

test.describe('Homepage', () => {
  test('should display the site title and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /blake oxford/i })).toBeVisible();
    const mainNav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(mainNav.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Blog', exact: true })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
  });
});

test.describe('About Page', () => {
  test('should display about page content', async ({ page }) => {
    await page.goto('/about/');
    // Check that the page loads and has the about section
    await expect(page.locator('#about-me')).toBeVisible();
    // Check that Blake Oxford appears somewhere on the page
    await expect(page.locator('body')).toContainText(/blake oxford/i);
  });
});

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    await expect(
      page.getByRole('heading', { name: /bring the hardest bottleneck/i })
    ).toBeVisible();
    const contactForm = page.locator('#contact-form');
    await expect(contactForm).toBeVisible();
    await expect(contactForm).toHaveAttribute('action', '/send-email');
    await expect(page.getByText('Cloudflare delivery', { exact: true })).toBeVisible();
    await expect(page.locator('#turnstile-shell')).toBeVisible();
    await expect(page.getByText('Protected by Cloudflare', { exact: true })).toBeVisible();
    await expect(page.locator('#contact-message-section')).toBeVisible();
    await expect(page.locator('#message')).toHaveCount(1);

    const duplicateIds = await page.locator('[id]').evaluateAll((elements) => {
      const ids = elements.map((element) => element.id);
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    });
    expect(duplicateIds).toEqual([]);
  });
});

test.describe('404 Page', () => {
  test('should show 404 for non-existent route', async ({ page }) => {
    await page.goto('/thispagedoesnotexist', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/404/i)).toBeVisible();
  });
});

test.describe('Design system documentation', () => {
  test('renders component contracts from the manifest', async ({ page }) => {
    await page.goto('/design/components/');
    await expect(page.getByRole('heading', { name: 'Component Contracts' })).toBeVisible();
    await expect(page.getByText(/documented components across \d+ categories/)).toBeVisible();
    await expect(
      page.getByText('src/data/component-docs/manifest.ts', { exact: true }).first()
    ).toBeVisible();
  });

  test('renders pattern tier counts from the manifest', async ({ page }) => {
    await page.goto('/design/patterns/');
    await expect(page.getByRole('heading', { name: 'Patterns' })).toBeVisible();
    await expect(page.getByText(/documented components/).first()).toBeVisible();
  });
});

test.describe('Cross-renderer surfaces', () => {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`preserves semantic surfaces at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/blog/combating-legal-ai-hallucinations/');
      await expect(
        page.getByRole('heading', { name: /Combating Legal AI Hallucinations/i }).first()
      ).toBeVisible();
      await expect(page.getByText('Ground legal AI in verified source material')).toBeVisible();

      await page.goto('/accessibility/keyboard-shortcuts/');
      await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();
      await expect(page.getByText('Accessibility Features', { exact: true })).toBeVisible();
    });
  }
});
