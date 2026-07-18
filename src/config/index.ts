/**
 * Config Module - Consolidated exports for all configuration
 *
 * This barrel file provides a single import point for all configuration,
 * eliminating the need for multiple imports from different config files.
 *
 * @example
 * ```ts
 * import {
 *   SITE_URL,
 *   CANONICAL_URLS,
 *   CACHE_DURATIONS,
 *   siteConfig,
 *   navLinks
 * } from '@/config';
 * ```
 */

// ─── Site Constants ───────────────────────────────────────────────
export {
  // Site configuration
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  // Contact
  CONTACT_EMAIL,
  NOREPLY_EMAIL,
  // URLs
  CANONICAL_URLS,
  // Rate limiting
  RATE_LIMIT,
  // Caching
  CACHE_DURATIONS,
  // SEO
  SEO,
  // Animations
  ANIMATION,
  // External services
  SERVICES,
  // Messages
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  // Collections
  COLLECTIONS,
  // Utility functions
  getCanonicalUrl,
  getPageTitle,
  isHashedPath,
} from './constants';

// ─── Application Configuration ────────────────────────────────────
export {
  ConfigManager,
  getConfig,
  getConfigManager,
  defaultConfig,
  createConfig,
  validateConfig,
} from './app-config';
export type {
  AppConfig,
  AccessibilityConfig,
  DropdownConfig,
  SearchConfig,
  AnalyticsConfig,
} from './app-config';

// ─── Site Data ────────────────────────────────────────────────────
export { siteConfig, technologies } from './data';

// ─── Navigation ───────────────────────────────────────────────────
export { default as navLinks, navConfig, type NavLink, type NavConfig } from './navLinks';

// ─── API Schemas ──────────────────────────────────────────────────
export {
  ProjectApiSchema,
  ProjectsApiSchema,
  BlogApiSchema,
  BlogApiSchemaArray,
} from './apiSchemas';
