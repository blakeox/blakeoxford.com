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

const achievementCardSchema = z.object({
  icon: z.enum(['home', 'chart', 'lightbulb']),
  title: z.string(),
  description: z.string(),
  achievements: z.array(z.string()),
  achievementIcons: z.array(z.enum(['grid', 'clock', 'users', 'dollar', 'trending'])).optional(),
});

const timelineItemSchema = z.object({
  year: z.string(),
  icon: z.string(),
  title: z.string(),
  achievements: z.array(z.string()),
  color: z.string(),
});

const socialLinkSchema = z.object({
  name: z.string(),
  url: z.string(),
  icon: z.enum(['linkedin', 'github', 'microsoft-learn']),
});

const contactChannelSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  href: z.string(),
  label: z.string(),
});

// About page content
const about = defineCollection({
  loader: glob({ pattern: 'page.json', base: './src/content/about' }),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    hero: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
      proofPoints: z.array(z.string()),
    }),
    achievements: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
      cards: z.array(achievementCardSchema),
    }),
    social: z.object({
      title: z.string(),
      description: z.string(),
      links: z.array(socialLinkSchema),
    }),
    education: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
      institution: z.string(),
      degree: z.string(),
      educationDescription: z.string(),
      skillsIntro: z.string(),
      skills: z.array(z.string()),
    }),
    timeline: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
      items: z.array(timelineItemSchema),
    }),
    closing: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
    }),
  }),
});

// Contact page content
const contact = defineCollection({
  loader: glob({ pattern: 'page.json', base: './src/content/contact' }),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    hero: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
      scenarios: z.array(z.string()),
      primaryCta: z.object({ href: z.string(), label: z.string() }),
      secondaryCta: z.object({ href: z.string(), label: z.string() }),
      sidebar: z.object({
        heading: z.string(),
        items: z.array(z.string()),
        note: z.string(),
      }),
    }),
    channels: z.object({
      heading: z.string(),
      title: z.string(),
      description: z.string(),
      items: z.array(contactChannelSchema),
    }),
  }),
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

export const collections = { blog, projects, about, contact, navigation };
