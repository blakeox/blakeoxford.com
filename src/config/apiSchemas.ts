// Centralized API contract schemas for test reuse
import { z } from 'zod';

export const ProjectApiSchema = z.object({
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

export const BlogApiSchema = z.object({
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

export const ProjectsApiSchema = z.array(ProjectApiSchema);
export const BlogApiSchemaArray = z.array(BlogApiSchema);