import { z, defineCollection } from 'astro:content';

export const collections = {
  blog: defineCollection({
    schema: z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
    }),
  }),
  projects: defineCollection({
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.date(),
      image: z.string().optional(),
      tags: z.array(z.string()).optional(),
      link: z.string().optional(),
      draft: z.boolean().optional(),
    }),
  }),
};
