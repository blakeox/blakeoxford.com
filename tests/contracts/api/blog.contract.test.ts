import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const BlogContract = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  tags: z.array(z.string()),
  author: z.string(),
  featured: z.boolean(),
  draft: z.boolean(),
  excerpt: z.string(),
});

const BlogApiContract = z.array(BlogContract);

function loadJson(rel: string) {
  const filePath = path.join(process.cwd(), rel);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('Blog API Contract', () => {
  it('public/search/blog.json matches contract', () => {
    const data = loadJson('public/search/blog.json');
    BlogApiContract.parse(data);
  });
});
