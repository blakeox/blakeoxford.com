/**
 * Component prop interfaces used across the design system.
 */

import type { CollectionEntry } from 'astro:content';

/**
 * BlogPostRow — row layout for blog listings
 */
export interface BlogPostRowProps {
  post: CollectionEntry<'blog'>;
  align?: 'left' | 'right';
  featured?: boolean;
}

/**
 * ProjectCard — case study listing card
 */
export interface ProjectCardProps {
  project: CollectionEntry<'projects'>;
  featured?: boolean;
  showImage?: boolean;
  showTags?: boolean;
  /** Homepage-dense card: image, title, proof, CTA — no tag/meta chrome. */
  compact?: boolean;
  /** Optional Work/Daring label for home duality teasers. */
  sideLabel?: 'Work' | 'Daring';
}
