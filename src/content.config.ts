import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog collection schema
const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
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
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    impact: z.array(z.string()).default([]),
    metrics: z
      .array(
        z.object({
          metric: z.string(),
          result: z.string(),
          timeline: z.string(),
        })
      )
      .default([]),
    journey: z.array(z.string()).default([]),
    lessons: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      )
      .default([]),
    reflection: z.string().optional(),
    ctaHeading: z.string().optional(),
    ctaDescription: z.string().optional(),
    link: z.url().optional(),
    external: z.url().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const navigationLink = z.object({
  href: z.string(),
  label: z.string(),
  external: z.boolean().optional(),
  target: z.string().optional(),
});

// Navigation collection schema
const navigation = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/navigation' }),
  schema: z.object({
    links: z.array(navigationLink),
    quickLinks: z.array(navigationLink).optional(),
    socialLinks: z.array(navigationLink.extend({
      icon: z.string().optional(),
    })).optional(),
  }),
});

export const collections = { blog, projects, navigation };
