/**
 * Site-wide constants and configuration
 * Single source of truth for URLs, metadata, and common values
 */

// ─── Site Configuration ──────────────────────────────────────────
export const SITE_URL = 'https://blakeoxford.com';
export const SITE_NAME = 'Blake Oxford';
export const SITE_TITLE = 'Blake Oxford - Enterprise Systems Architect & Technology Leader';
export const SITE_DESCRIPTION = 'Innovative technology leader specializing in enterprise systems architecture, healthcare IT, cloud infrastructure, and business intelligence solutions.';

// ─── Contact Information ─────────────────────────────────────────
export const CONTACT_EMAIL = 'blakepoxford@outlook.com';
export const NOREPLY_EMAIL = 'noreply@blakeoxford.com';

// ─── Canonical URLs ──────────────────────────────────────────────
export const CANONICAL_URLS = {
  home: `${SITE_URL}/`,
  about: `${SITE_URL}/about/`,
  blog: `${SITE_URL}/blog/`,
  projects: `${SITE_URL}/projects/`,
  contact: `${SITE_URL}/contact/`,
} as const;

// ─── Rate Limiting Configuration ─────────────────────────────────
export const RATE_LIMIT = {
  WINDOW_SECONDS: 30,
  MAX_PER_WINDOW: 2,
  KV_TTL: 60,
} as const;

// ─── Cache Configuration ─────────────────────────────────────────
export const CACHE_DURATIONS = {
  // Asset caching
  assets: {
    fonts: 2592000,            // 30 days
    images: 604800,            // 7 days
    jsCss: 604800,             // 7 days
    videos: 2592000,           // 30 days
    default: 86400,            // 1 day (non-hashed assets)
  },
  
  // Page caching
  pages: {
    html: 300,                 // 5 minutes (CDN cache)
    htmlStaleWhileRevalidate: 3600, // 1 hour stale-while-revalidate
    robots: 300,               // 5 minutes
    sitemap: 300,              // 5 minutes
    manifest: 3600,            // 1 hour
    searchIndex: 600,          // 10 minutes
  },
  
  // API caching
  api: {
    default: 300,              // 5 minutes
  },
  
  // Static build artifacts (hashed filenames)
  static: {
    hashed: 31536000,          // 1 year (immutable)
  },
} as const;

// ─── SEO & Meta Configuration ────────────────────────────────────
export const SEO = {
  defaultImage: '/assets/images/Blake-O-scaled.jpg',
  twitterHandle: '@blakeoxford',
  locale: 'en_US',
  type: 'website',
} as const;

// ─── Animation & Transition Constants ────────────────────────────
// Note: Tailwind duration classes map to these values
// Use Tailwind utility classes (e.g., duration-200, duration-300, duration-500)
// CSS variables available: var(--transition-fast), var(--transition), var(--transition-slow)
export const ANIMATION = {
  durations: {
    fast: 200,             // Quick interactions (hover, focus)
    normal: 300,           // Standard transitions
    slow: 500,             // Dramatic effects (modal, overlay)
  },
  easings: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Material Design standard
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',  // Decelerate
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',  // Accelerate
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',     // Sharp
  },
} as const;

// ─── External Services ───────────────────────────────────────────
export const SERVICES = {
  turnstileVerifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  plausibleDomain: 'blakeoxford.com',
} as const;

// ─── Error Messages ──────────────────────────────────────────────
export const ERROR_MESSAGES = {
  missingFields: 'Missing required fields or Turnstile token.',
  rateLimited: 'Too many requests. Please wait a bit.',
  botVerificationFailed: 'Bot verification failed.',
  emailSendFailed: 'Failed to send email.',
  genericError: 'An error occurred. Please try again later.',
} as const;

// ─── Success Messages ────────────────────────────────────────────
export const SUCCESS_MESSAGES = {
  emailSent: 'Message sent successfully!',
  formSubmitted: 'Thank you for your message!',
} as const;

// ─── Content Collections ─────────────────────────────────────────
export const COLLECTIONS = {
  blog: 'blog',
  projects: 'projects',
} as const;

// ─── Helper Functions ────────────────────────────────────────────

/**
 * Generate canonical URL for a given path
 */
export function getCanonicalUrl(path: string = ''): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generate page title with site name
 */
export function getPageTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_TITLE;
}

/**
 * Check if a path is hashed (immutable asset)
 */
export function isHashedPath(path: string): boolean {
  if (path.startsWith('/_astro/')) return true;
  return /\.[a-f0-9]{8,}\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2|pdf)$/.test(path);
}
