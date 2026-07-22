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
    featured: z.boolean().default(false),
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
  title: z.string(),
  description: z.string(),
  achievements: z.array(z.string()),
});

const timelineItemSchema = z.object({
  year: z.string(),
  title: z.string(),
  achievements: z.array(z.string()),
});

const socialLinkSchema = z.object({
  name: z.string(),
  url: z.string(),
});

const contactChannelSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
  href: z.string(),
  label: z.string(),
});

const ctaLinkSchema = z.object({
  href: z.string(),
  label: z.string(),
});

const homeResumeHighlightItemSchema = z.object({
  text: z.string(),
});

const homeResumeHighlightSideSchema = z.object({
  side: z.enum(['work', 'daring']),
  label: z.string(),
  metric: z.string(),
  title: z.string(),
  items: z.array(homeResumeHighlightItemSchema).max(3),
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

// Home page content
const home = defineCollection({
  loader: glob({ pattern: 'page.json', base: './src/content/home' }),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    hero: z.object({
      kicker: z.string(),
      defaultTagline: z.string(),
      primaryCta: ctaLinkSchema,
      secondaryCta: ctaLinkSchema,
      portrait: z.object({
        frontSrc: z.string(),
        backSrc: z.string(),
        alt: z.string(),
        altBack: z.string(),
      }),
    }),
    resumeHighlights: z.object({
      kicker: z.string(),
      title: z.string(),
      description: z.string(),
      sides: z.array(homeResumeHighlightSideSchema).length(2),
    }),
    recentProjects: z.object({
      kicker: z.string().optional(),
      title: z.string(),
      description: z.string(),
      cta: ctaLinkSchema,
    }),
    latestPosts: z.object({
      kicker: z.string().optional(),
      title: z.string(),
      description: z.string(),
      emptyMessage: z.string(),
      cta: ctaLinkSchema,
    }),
    cta: z.object({
      kicker: z.string().optional(),
      title: z.string(),
      description: z.string(),
      button: ctaLinkSchema,
    }),
  }),
});

// Navigation collection schema
const navigation = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/navigation' }),
  schema: z.object({
    links: z.array(navigationLink),
    quickLinks: z.array(navigationLink).optional(),
    socialLinks: z
      .array(
        navigationLink.extend({
          icon: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const collections = { blog, projects, about, contact, home, navigation };
