import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Contract schema aligned to generated projects search/export format
const ProjectContract = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  tags: z.array(z.string()),
  featured: z.boolean(),
  draft: z.boolean().optional(),
  technologies: z.array(z.string()).optional(),
  image: z.string().optional(),
});

const ProjectsApiContract = z.array(ProjectContract);

function loadJson(rel: string) {
  const filePath = path.join(process.cwd(), rel);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

describe('Projects API Contract', () => {
  it('public/api/projects.json matches contract', () => {
    const data = loadJson('public/api/projects.json');
    const parsed = ProjectsApiContract.parse(data);
    expect(parsed.length).toBeGreaterThan(0);
    // At least first three should be featured as per generation logic
    const featuredCount = parsed.slice(0, 3).filter(p => p.featured).length;
    expect(featuredCount).toBe(3);
  });

  it('search/projects.json matches contract', () => {
    const data = loadJson('public/search/projects.json');
    ProjectsApiContract.parse(data);
  });
});
