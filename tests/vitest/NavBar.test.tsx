import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('NavBar Astro template', () => {
  const filePath = path.resolve(__dirname, '../../src/components/layout/NavBar.astro');
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should render a <nav> element', () => {
    expect(content).toContain('<nav');
  });

  it('should include nav link markup for aria-current to be set at build time', () => {
    expect(content).toContain('nav-link');
  });

  it('should enhance via ModernNavBar progressive script', () => {
    expect(content).toContain('initModernNavBar');
  });

  it('should include the mobile burger control', () => {
    expect(content).toContain('nav-toggle');
    expect(content).toContain('nav-mobile-links');
  });

  it('should bind the burger with a classic inline script', () => {
    expect(content).toContain('is:inline');
    expect(content).toContain('__boNavMenuAC');
  });
});


