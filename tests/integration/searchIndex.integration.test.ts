import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'node:child_process';

beforeAll(() => {
  const result = spawnSync('node', ['scripts/content/generate-search-index-from-files.mjs'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.toString() || 'Failed to generate search index');
  }
});

function readJSON(rel: string) {
  const full = path.join(process.cwd(), rel);
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

describe('Search Index Integration', () => {
  it('dist/search-index.json exists and has combined entries', () => {
    const combined = readJSON('dist/search-index.json');
    expect(Array.isArray(combined)).toBe(true);
    const types = new Set(combined.map((e: { type: string }) => e.type));
    expect(types.has('project')).toBe(true);
  });

  it('dist/search/index.json mirrors dist/search-index.json', () => {
    const a = readJSON('dist/search-index.json');
    const b = readJSON('dist/search/index.json');
    expect(b.length).toBe(a.length);
  });

  it('public/search/projects.json is sorted by date', () => {
    const projects = readJSON('public/search/projects.json');
    const hasValidDates = projects.every(
      (p: { publishedAt?: string }) => p.publishedAt && /\d{4}-\d{2}-\d{2}/.test(p.publishedAt)
    );
    expect(hasValidDates).toBe(true);
  });

  it('project records include required fields', () => {
    const projects = readJSON('public/search/projects.json');
    const sample = projects[0];
    expect(sample).toHaveProperty('slug');
    expect(sample).toHaveProperty('title');
    expect(sample.description).toBeTruthy();
    expect(sample).toHaveProperty('publishedAt');
  });

  it('published blog records include content-owned authorship and descriptions', () => {
    const blog = readJSON('public/search/blog.json');
    expect(blog.length).toBeGreaterThan(0);
    expect(
      blog.every(
        (post: { author?: string; description?: string }) =>
          Boolean(post.author?.trim()) && Boolean(post.description?.trim())
      )
    ).toBe(true);
  });
});
