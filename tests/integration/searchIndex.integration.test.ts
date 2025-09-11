import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';

// Execute the real generation script once for this suite
beforeAll(async () => {
  const scriptPath = path.join(process.cwd(), 'scripts/content/generate-search-index.js');
  // Dynamic import to run side-effects
  await import(scriptPath);
});

function readJSON(rel: string) {
  const full = path.join(process.cwd(), rel);
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

describe('Search Index Integration', () => {
  it('dist/search-index.json exists and has combined entries', () => {
    const combined = readJSON('dist/search-index.json');
    expect(Array.isArray(combined)).toBe(true);
    const types = new Set(combined.map(e => e.type));
    expect(types.has('project')).toBe(true);
    expect(types.has('blog')).toBe(true);
  });

  it('dist/search/index.json mirrors dist/search-index.json', () => {
    const a = readJSON('dist/search-index.json');
    const b = readJSON('dist/search/index.json');
    expect(b.length).toBe(a.length);
  });

  it('public/search/projects.json has featured first 3 entries', () => {
    const projects = readJSON('public/search/projects.json');
    expect(projects.slice(0, 3).every(p => p.featured === true)).toBe(true);
  });

  it('project records include required fields', () => {
    const projects = readJSON('public/search/projects.json');
    const sample = projects[0];
    expect(sample).toHaveProperty('slug');
    expect(sample).toHaveProperty('title');
    expect(sample).toHaveProperty('publishedAt');
  });
});
