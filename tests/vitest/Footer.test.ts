import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';
import navJson from '../../src/content/navigation/nav.json';

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

  it('should have a navigation section labeled Footer', () => {
    expect(content).toContain('role="navigation"');
    expect(content).toContain('aria-label="Footer"');
    expect(content).not.toContain('Quick Links');
    expect(content).not.toContain('Connect with Me');
    expect(content).not.toContain('Made with');
  });

  it('should source page and social links from nav.json via navLinks', () => {
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
    expect(content).toMatch(/quickLinks\.map\(\(link\)\s*=>/);
  });

  it('should include copyright notice with dynamic year', () => {
    expect(content).toContain('© {year}');
    expect(content).toContain('Blake Oxford');
    expect(content).not.toContain("Blake Oxford's portfolio");
  });

  it('should include a back-to-top link with aria-label', () => {
    expect(content).toContain('href="#top"');
    expect(content).toContain('aria-label="Back to top"');
  });
});
