/**
 * Core Type Definitions - Central Export Hub
 * Re-exports all type definitions from domain-specific modules
 * 
 * Type Organization:
 * - core.ts: Base interfaces and shared types
 * - accessibility.ts: Accessibility-related types
 * - dropdown.ts: Dropdown component types
 * - content.ts: Content collection types (blog, projects)
 * - components.ts: Component prop interfaces
 * - api.ts: API endpoint types
 */

// Re-export all consolidated types from domain-specific files
export * from './core';
export * from './accessibility';
export * from './dropdown';
export * from './content';
export * from './components';
export * from './api';

// ============================================================================
// Legacy Types (Kept for backward compatibility)
// ============================================================================
// NOTE: These types are deprecated but kept for backward compatibility.
// All new code should use types from './content' and 'astro:content' instead.
// Migration status: Most usages have been migrated. Remaining usages are
// in legacy components that will be updated incrementally.

/**
 * @deprecated Use CollectionEntry<'projects'> from 'astro:content' instead
 * @see src/types/content.ts for the new type system
 */
export interface ProjectData {
  slug: string;
  data: {
    title: string;
    description: string;
    date: Date;
    tags: string[];
    image?: string;
    link?: string;
    draft: boolean;
  };
}

/**
 * @deprecated Use CollectionEntry<'blog'> from 'astro:content' instead
 * @see src/types/content.ts for the new type system
 */
export interface BlogPost {
  slug: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    author?: string;
    tags?: string[];
    draft?: boolean;
  };
}

// ============================================================================
// Utility Types (Kept for general use)
// ============================================================================

/**
 * ImageMetadata type for Astro image imports
 */
export interface ImageMetadata {
  src: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Site configuration
 */
export interface SiteConfig {
  name: string;
  domain: string;
  author: string;
  description: string;
  tagline: string;
  email: string;
  social: {
    twitter: string;
    github: string;
    linkedin: string;
  };
}