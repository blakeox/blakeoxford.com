import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ProjectsApiSchema } from '../../../src/config/apiSchemas';

function loadJson(rel: string) {
  const filePath = path.join(process.cwd(), rel);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

describe('Projects search index contract', () => {
  it('public/search/projects.json matches contract', () => {
    const data = loadJson('public/search/projects.json');
    const parsed = ProjectsApiSchema.parse(data);
    expect(parsed.length).toBeGreaterThan(0);
    const hasValidDates = parsed.every(
      (p) => p.publishedAt && /\d{4}-\d{2}-\d{2}/.test(p.publishedAt)
    );
    expect(hasValidDates).toBe(true);
  });
});
