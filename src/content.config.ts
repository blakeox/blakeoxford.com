import { defineCollection, z } from 'astro:content';

// Blog collection schema
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Projects collection schema
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string(),
    highlights: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    impact: z.array(z.string()).default([]),
    link: z.string().url().optional(),
    external: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
