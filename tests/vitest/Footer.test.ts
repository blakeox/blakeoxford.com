import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';
import navJson from '../../src/content/navigation/nav.json';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/layout/Footer.astro');
let content: string;

describe('Footer.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should contain a <footer> element', () => {
    expect(content).toContain('<footer');
  });

  it('should have a navigation section with aria-label "Footer Quick Links"', () => {
    expect(content).toContain('role="navigation"');
    expect(content).toContain('aria-label="Footer Quick Links"');
  });

  it('should source quick links and social links from nav.json via navLinks', () => {
    expect(content).toContain('getNavQuickLinks()');
    expect(content).toContain('navConfig.socialLinks');

    const linkedin = navJson.socialLinks?.find((link) => link.icon === 'linkedin');
    const github = navJson.socialLinks?.find((link) => link.icon === 'github');
    const email = navJson.socialLinks?.find((link) => link.icon === 'email');

    expect(linkedin?.href).toContain('linkedin.com');
    expect(github?.href).toContain('github.com/blakeox');
    expect(email?.href).toMatch(/^mailto:/);
  });

  it('should render footer quick links from nav.json', () => {
    for (const link of navJson.quickLinks ?? []) {
      expect(content).not.toContain(`href="${link.href}"`);
    }
    expect(content).toContain('{quickLinks.map((link) =>');
  });

  it('should include copyright notice with dynamic year', () => {
    expect(content).toContain('© {year}');
  });

  it('should include a back-to-top link with aria-label', () => {
    expect(content).toContain('href="#top"');
    expect(content).toContain('aria-label="Back to Top"');
  });
});
