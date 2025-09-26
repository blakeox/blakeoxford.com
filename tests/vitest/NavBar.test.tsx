import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('NavBar island template', () => {
  const filePath = path.resolve(__dirname, '../../src/components/islands/NavBarIsland.tsx');
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should render a <nav> element', () => {
    expect(content).toContain('<nav');
  });

  it('should include nav link markup for aria-current to be set at runtime', () => {
    expect(content).toContain('nav-link');
  });
});
