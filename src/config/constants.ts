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
  STATIC_IMMUTABLE: 31536000, // 1 year for hashed assets
  STATIC_ASSETS: 86400,        // 1 day for static assets
  HTML_PAGES: 3600,            // 1 hour for HTML
  API_RESPONSES: 300,          // 5 minutes for API
  ROBOTS_TXT: 300,             // 5 minutes
  SITEMAP: 300,                // 5 minutes
  MANIFEST: 3600,              // 1 hour
  SEARCH_INDEX: 600,           // 10 minutes
} as const;

// ─── Common CSS Classes (Tailwind patterns) ──────────────────────
export const CSS_CLASSES = {
  // Card patterns
  card: 'bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 dark:border-border-dark/50',
  cardHover: 'hover-lift-sm transition-all duration-300 hover:shadow-2xl hover:border-accent/50 dark:hover:border-accent/30',
  cardInteractive: 'relative overflow-hidden group',
  
  // Achievement/Feature card (homepage)
  achievementCard: 'bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 dark:border-border-dark/50 p-6 flex flex-col h-full hover-lift-sm transition-all duration-300 hover:shadow-2xl hover:border-accent/50 dark:hover:border-accent/30 relative overflow-hidden group',
  
  // Section containers
  section: 'py-16 sm:py-20 lg:py-24 relative',
  container: 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8',
  
  // Typography
  heading1: 'text-4xl sm:text-5xl md:text-6xl font-bold',
  heading2Major: 'text-3xl sm:text-4xl md:text-5xl font-bold',
  heading2: 'text-2xl sm:text-3xl md:text-4xl font-bold',
  heading3: 'text-xl sm:text-2xl font-bold',
  
  // Buttons
  btnPrimary: 'inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-7 py-3 text-sm font-semibold shadow-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/65 focus-visible:ring-offset-2',
  btnSecondary: 'inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent/60 px-6 sm:px-7 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:text-accent-dark hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2',
} as const;

// ─── SEO & Meta Configuration ────────────────────────────────────
export const SEO = {
  defaultImage: '/assets/images/Blake-O-scaled.jpg',
  twitterHandle: '@blakeoxford',
  locale: 'en_US',
  type: 'website',
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
