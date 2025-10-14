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
// TODO: Migrate usages to new types from content.ts and components.ts

/**
 * @deprecated Use Project from './content' instead
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
 * @deprecated Use BlogPost from './content' instead
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