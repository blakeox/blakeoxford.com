/**
 * Core Type Definitions - Central Export Hub
 *
 * Type Organization:
 * - components.ts: Component prop interfaces
 * - api.ts: API endpoint types
 */

export * from './components';
export * from './api';

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
