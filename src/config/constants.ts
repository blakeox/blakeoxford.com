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

// ─── Common CSS Classes (Tailwind patterns) ──────────────────────
export const CSS_CLASSES = {
  // Card patterns
  card: {
    // Base card styles
    base: 'bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 dark:border-border-dark/50',
    
    // Card variants
    compact: 'rounded-2xl border border-border/30 bg-background/95 shadow-lg dark:border-border-dark/30 dark:bg-surface/80',
    elevated: 'rounded-3xl bg-surface/95 ring-1 ring-border/30 shadow-lg',
    glass: 'bg-surface/90 backdrop-blur-sm border border-border dark:border-border-dark rounded-xl',
    
    // Hover effects
    hoverLift: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
    hoverLiftSm: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
    hoverGradient: 'pointer-events-none absolute inset-0 bg-gradient-to-br from-background/70 via-surface/85 to-background/65 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
    
    // Interactive states
    interactive: 'group relative overflow-hidden',
    focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
    
    // Complete card compositions
    blog: 'group flex flex-col h-full rounded-2xl border border-border/30 bg-background/95 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-border-dark/30 dark:bg-surface/80',
    project: 'relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface/95 ring-1 ring-border/30 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
    feature: 'bg-surface dark:bg-surface-dark rounded-xl shadow-xl border border-border/50 dark:border-border-dark/50 p-6 flex flex-col h-full hover-lift-sm transition-all duration-300 hover:shadow-2xl hover:border-accent/50 dark:hover:border-accent/30 relative overflow-hidden group',
  },
  
  // Section containers
  section: 'py-16 sm:py-20 lg:py-24 relative',
  container: 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8',
  
  // Typography
  heading: {
    h1: 'text-4xl sm:text-5xl md:text-6xl font-bold',
    h2Major: 'text-3xl sm:text-4xl md:text-5xl font-bold',
    h2: 'text-2xl sm:text-3xl md:text-4xl font-bold',
    h3: 'text-xl sm:text-2xl font-bold',
  },
  
  // Buttons
  button: {
    primary: 'inline-flex items-center justify-center gap-2 rounded-full px-6 sm:px-7 py-3 text-sm font-semibold shadow-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/65 focus-visible:ring-offset-2',
    secondary: 'inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent/60 px-6 sm:px-7 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:text-accent-dark hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2',
  },
  
  // Image effects
  image: {
    scaleHover: 'transition-transform duration-500 group-hover:scale-105',
    scaleHoverSm: 'transition-transform duration-500 group-hover:scale-[1.04]',
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
