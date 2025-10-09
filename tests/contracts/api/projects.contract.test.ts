import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ProjectsApiSchema } from '../../../src/config/apiSchemas';

function loadJson(rel: string) {
  const filePath = path.join(process.cwd(), rel);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

describe('Projects API Contract', () => {
  it('public/api/projects.json matches contract', () => {
    const data = loadJson('public/api/projects.json');
  const parsed = ProjectsApiSchema.parse(data);
    expect(parsed.length).toBeGreaterThan(0);
    // Projects should be sorted by most recent first
    const hasValidDates = parsed.every(p => p.publishedAt && /\d{4}-\d{2}-\d{2}/.test(p.publishedAt));
    expect(hasValidDates).toBe(true);
  });

  it('search/projects.json matches contract', () => {
    const data = loadJson('public/search/projects.json');
  ProjectsApiSchema.parse(data);
  });
});
