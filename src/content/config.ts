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
    date: z.date().optional(),
    tags: z.array(z.string()).default([]),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    image: z.string().optional(),
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
    link: z.string().url().optional(),
    external: z.string().url().optional(),
  }),
});

// Navigation collection schema
const navigation = defineCollection({
  type: 'data',
  schema: z.object({
    links: z.array(z.object({
      href: z.string(),
      label: z.string(),
      external: z.boolean().optional(),
      target: z.string().optional(),
    })),
    socialLinks: z.array(z.object({
      href: z.string(),
      label: z.string(),
      external: z.boolean().optional(),
      target: z.string().optional(),
    })).optional(),
  }),
});

export const collections = { blog, projects, navigation };
