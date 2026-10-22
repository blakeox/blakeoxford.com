/**
 * Sentry configuration for Cloudflare Workers edge functions
 * Optimized for free tier with conservative sample rates
 */
import * as Sentry from '@sentry/cloudflare';

/**
 * Initialize Sentry for edge runtime
 * @param {Object} env - Cloudflare Workers environment bindings
 * @returns {Object} Configured Sentry instance
 */
export function initEdgeSentry(env) {
  try {
    // Avoid re-initializing if a client is already set (e.g., during local reloads)
    if (!Sentry.isInitialized?.()) {
      const client = new Sentry.CloudflareClient({
        dsn: env.SENTRY_DSN_EDGE, // Use edge-specific DSN (set via Cloudflare secret)
        environment: env.ENVIRONMENT || 'production',
        release: env.GIT_COMMIT || 'unknown',
        
        // FREE TIER OPTIMIZATION: Very low sample rate for edge (high traffic)
        tracesSampleRate: 0.05, // 5% of requests (edge handles many requests)
        
        // Add Cloudflare-specific context to all events
        beforeSend(event) {
          // Skip Turnstile verification errors (expected behavior)
          if (event.exception?.values?.[0]?.value?.includes('Turnstile')) {
            return null;
          }
          
          // Add Cloudflare context if available
          if (event.request?.cf) {
            event.contexts = {
              ...event.contexts,
              cloudflare: {
                colo: event.request.cf.colo, // Edge datacenter (e.g., "SJC")
                country: event.request.cf.country, // Country code
                city: event.request.cf.city, // City name
                asn: event.request.cf.asn, // Autonomous System Number
              },
            };
          }
          
          return event;
        },
        
        // Ignore known bot/crawler requests to save quota
        beforeSendTransaction(event) {
          const userAgent = event.request?.headers?.['user-agent'] || '';
          const isBot = /bot|crawler|spider|headless|lighthouse|gtmetrix|pagespeed|uptimerobot/i.test(userAgent);
          
          if (isBot) {
            return null; // Don't track bots
          }
          
          return event;
        },
      });
      Sentry.setCurrentClient(client);
    }
  } catch (e) {
    // Swallow init errors to avoid taking down the Worker; Sentry will be no-op
  try { console.warn('Sentry Cloudflare init failed:', e?.message || String(e)); } catch { /* ignore */ }
  }
  
  return Sentry;
}

/**
 * Helper to capture exceptions with context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export function captureEdgeException(error, context = {}) {
  Sentry.captureException(error, {
    tags: {
      runtime: 'edge',
      ...context.tags,
    },
    extra: {
      ...context.extra,
    },
  });
}

/**
 * Helper to add breadcrumbs for request tracing
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addEdgeBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb({
    timestamp: Date.now() / 1000,
    ...breadcrumb,
  });
}
