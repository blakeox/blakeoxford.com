import { defineCollection, z } from 'astro:content';

// Define blog collection schema even if no content exists yet
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

// Define projects collection schema
const projects = defineCollection({
  type: 'content', 
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    link: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = {
  blog,
  projects,
};
