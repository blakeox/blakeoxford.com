// Centralized API contract schemas for test reuse
import { z } from 'zod';

export const ProjectApiSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  tags: z.array(z.string()),
  draft: z.boolean().optional(),
  technologies: z.array(z.string()).optional(),
  image: z.string().nullable().optional(),
});

export const ProjectsApiSchema = z.array(ProjectApiSchema);

export const BlogApiSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
  author: z.string().optional(),
  featured: z.boolean().optional(),
});

export const BlogApiSchemaArray = z.array(BlogApiSchema);
