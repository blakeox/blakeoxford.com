/**
 * Content Type Definitions
 * Consolidated types for blog posts, projects, and content collections
 */

import type { CollectionEntry } from 'astro:content';

// ============================================================================
// Content Collection Types
// ============================================================================

/**
 * Blog post from content collection
 * Represents a complete blog post with all metadata
 */
export type BlogPost = CollectionEntry<'projects'>;

/**
 * Project from content collection
 * Represents a complete project with all metadata
 */
export type Project = CollectionEntry<'projects'>;

/**
 * Navigation data from content collection
 */
export type NavigationData = CollectionEntry<'navigation'>;

// ============================================================================
// Inferred Content Data Types
// ============================================================================

/**
 * Blog post data (inferred from Zod schema)
 * - title: Post title
 * - description: Optional post description
 * - pubDate: Publication date
 * - updatedDate: Optional last update date
 * - tags: Array of tags
 * - heroImage: Optional hero image path
 * - draft: Draft status (default false)
 */
export type BlogPostData = BlogPost['data'];

/**
 * Project data (inferred from Zod schema)
 * - title: Project title
 * - description: Optional project description
 * - date: Optional project date
 * - tags: Array of tags
 * - url: Optional project URL
 * - repo: Optional repository URL
 * - image: Optional project image
 * - heroImage: Optional hero image
 * - highlights: Array of highlight strings
 * - categories: Array of category strings
 * - impact: Array of impact descriptions
 * - metrics: Array of metric objects
 * - journey: Array of journey milestone strings
 * - lessons: Array of lesson objects
 * - reflection: Optional reflection text
 * - link: Optional external link
 * - external: Optional external URL
 */
export type ProjectData = Project['data'];

// ============================================================================
// Content Display Types
// ============================================================================

/**
 * Simplified blog post for display
 * Used in cards, lists, and previews
 */
export interface BlogPostDisplay {
  slug: string;
  title: string;
  description?: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  heroImage?: string;
  excerpt?: string;
  readingTime?: string;
}

/**
 * Simplified project for display
 * Used in cards, grids, and previews
 */
export interface ProjectDisplay {
  slug: string;
  title: string;
  description?: string;
  date?: Date;
  tags: string[];
  image?: string;
  heroImage?: string;
  link?: string;
  highlights?: string[];
}

// ============================================================================
// Content Metadata Types
// ============================================================================

/**
 * Project metric with result and timeline
 */
export interface ProjectMetric {
  metric: string;
  result: string;
  timeline: string;
}

/**
 * Project lesson learned
 */
export interface ProjectLesson {
  title: string;
  description: string;
}

/**
 * Navigation link
 */
export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  target?: string;
}

/**
 * Social media link
 */
export interface SocialLink {
  href: string;
  label: string;
  icon?: string;
  external?: boolean;
  target?: string;
}
