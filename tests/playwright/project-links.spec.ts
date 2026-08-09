import { test, expect } from './fixtures';

/**
 * Project Links Validation Tests
 * 
 * Ensures all project links work correctly:
 * - All projects have valid pages (no 404s)
 * - All project cards link to working pages
 * - All project detail pages load successfully
 */

test.describe('Project Links Validation', () => {
  test('all project cards should link to working pages', async ({ page }) => {
    // Go to projects index page
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    
    // Get all project card links
    const projectLinks = page.locator('article a[href^="/projects/"]');
    const linkCount = await projectLinks.count();
    
    console.log(`Found ${linkCount} project card links`);
    expect(linkCount).toBeGreaterThan(0);
    
    const failedLinks: Array<{ href: string; status: number | null; error?: string }> = [];
    
    // Test each project link
    for (let i = 0; i < linkCount; i++) {
      const link = projectLinks.nth(i);
      const href = await link.getAttribute('href');
      
      if (!href) continue;
      
      console.log(`Testing project link: ${href}`);
      
      try {
        // Make a request to the project page
        const response = await page.request.get(href);
        const status = response.status();
        
        if (status !== 200) {
          failedLinks.push({ href, status });
          console.error(`❌ ${href}: ${status}`);
        } else {
          console.log(`✅ ${href}: ${status}`);
        }
      } catch (error) {
        failedLinks.push({ 
          href, 
          status: null, 
          error: error instanceof Error ? error.message : String(error) 
        });
        console.error(`❌ ${href}: ${error}`);
      }
    }
    
    // Report all failures
    if (failedLinks.length > 0) {
      const failureDetails = failedLinks.map(f => 
        `${f.href}: ${f.status !== null ? `HTTP ${f.status}` : f.error}`
      ).join('\n');
      
      throw new Error(`Project link failures:\n${failureDetails}`);
    }
  });

  test('all project detail pages should load successfully', async ({ page }) => {
    // List of all expected project slugs (from content collection)
    const projectSlugs = [
      'adp-workforcenow',
      'advancedmd-implementation',
      'bank-projections-modeling',
      'fanalyx-deterministic-finance-platform',
      'ferment-app',
      'google-workspace-migration',
      'llm-note-coaching',
      'microsoft-fabric',
    ];
    
    const failedPages: Array<{ slug: string; status: number | null; error?: string }> = [];
    
    for (const slug of projectSlugs) {
      const url = `/projects/${slug}/`;
      console.log(`Testing project page: ${url}`);
      
      try {
        const response = await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        const status = response?.status();
        
        if (status !== 200) {
          failedPages.push({ slug, status });
          console.error(`❌ ${url}: ${status}`);
        } else {
          // Verify essential content is present
          await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
          console.log(`✅ ${url}: ${status}`);
        }
      } catch (error) {
        failedPages.push({ 
          slug, 
          status: null, 
          error: error instanceof Error ? error.message : String(error) 
        });
        console.error(`❌ ${url}: ${error}`);
      }
    }
    
    // Report all failures
    if (failedPages.length > 0) {
      const failureDetails = failedPages.map(f => 
        `/projects/${f.slug}/: ${f.status !== null ? `HTTP ${f.status}` : f.error}`
      ).join('\n');
      
      throw new Error(`Project page failures:\n${failureDetails}`);
    }
  });

  test('project cards should have proper link structure', async ({ page }) => {
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    
    // Get all project cards
    const cards = page.locator('article').filter({ has: page.locator('a[href^="/projects/"]') });
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Found ${cardCount} project cards`);
    
    // Each card should have:
    // 1. A title/heading
    // 2. A link
    // 3. Proper aria attributes
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      
      // Should have a heading
      const heading = card.locator('h3').first();
      await expect(heading).toBeVisible();
      
      // Should have a clickable link
      const link = card.locator('a[href^="/projects/"]').first();
      await expect(link).toBeVisible();
      
      // Link should have proper attributes
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/projects\/.+\/$/);
    }
  });

  test('clicking a project card should navigate to detail page', async ({ page }) => {
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    
    // Get the first project card link
    const firstProjectLink = page.locator('article a[href^="/projects/"]').first();
    await expect(firstProjectLink).toBeVisible();
    
    const href = await firstProjectLink.getAttribute('href');
    expect(href).toBeTruthy();
    
    // Click the link
    await firstProjectLink.click();
    
    // Wait for navigation
    await page.waitForURL(new RegExp(href!), { timeout: 10000 });
    
    // Verify we're on the project detail page
    const response = page.url();
    expect(response).toContain('/projects/');
    
    // Page should have loaded successfully
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
    
    // Should have project-specific content
    await expect(page.locator('main, article').first()).toBeVisible();
  });

  test('all blog links should work', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'networkidle' });
    
    const blogLinks = page.locator('article a[href^="/blog/"]');
    const linkCount = await blogLinks.count();
    
    console.log(`Found ${linkCount} blog post links`);
    
    const failedLinks: Array<{ href: string; status: number | null }> = [];
    
    for (let i = 0; i < linkCount; i++) {
      const link = blogLinks.nth(i);
      const href = await link.getAttribute('href');
      
      if (!href || href === '/blog/') continue;
      
      try {
        const response = await page.request.get(href);
        const status = response.status();
        
        if (status !== 200) {
          failedLinks.push({ href, status });
          console.error(`❌ ${href}: ${status}`);
        } else {
          console.log(`✅ ${href}: ${status}`);
        }
      } catch (error) {
        failedLinks.push({ href, status: null });
        console.error(`❌ ${href}: ${error}`);
      }
    }
    
    if (failedLinks.length > 0) {
      const failureDetails = failedLinks.map(f => 
        `${f.href}: ${f.status !== null ? `HTTP ${f.status}` : 'Request failed'}`
      ).join('\n');
      
      throw new Error(`Blog link failures:\n${failureDetails}`);
    }
  });

  test('sitemap should include all projects', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    
    const sitemapContent = await response.text();
    
    // All project slugs should be in sitemap (checking actual URLs, not case-sensitive)
    const expectedProjects = [
      'adp-workforcenow',
      'advancedmd-implementation',
      'bank-projections-modeling',
      'fanalyx-deterministic-finance-platform',
      'ferment-app',
      'google-workspace-migration',
      'llm-note-coaching', // Sitemap might have LLM-note-coaching
      'microsoft-fabric', // Sitemap might have Microsoft-Fabric
    ];
    
    const sitemapLower = sitemapContent.toLowerCase();
    
    for (const slug of expectedProjects) {
      const found = sitemapLower.includes(`/projects/${slug}/`);
      if (!found) {
        console.error(`Missing in sitemap: /projects/${slug}/`);
      }
      expect(found).toBe(true);
    }
  });

  test('authoritative sitemap should exclude generated and noindex routes', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const sitemapContent = await response.text();
    const excludedRoutes = [
      '/accessibility/keyboard-shortcuts/',
      '/components/nav-preview/',
      '/components/project-card-preview/',
      '/design/animations/',
      '/design/components/',
      '/design/patterns/',
      '/design/tokens/',
      '/docs/components/',
    ];

    for (const route of excludedRoutes) {
      expect(sitemapContent).not.toContain(`https://blakeoxford.com${route}`);
    }

    const generatedSitemapResponse = await page.request.get('/sitemap-index.xml');
    expect(generatedSitemapResponse.status()).toBe(404);
  });
});
