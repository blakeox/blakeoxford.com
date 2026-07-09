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