/**
 * Sentry configuration for Cloudflare Workers edge functions
 * Optimized for free tier with conservative sample rates
 */
import * as Sentry from '@sentry/cloudflare';
import { createSentrySampler, sentryDataCollection } from './src/lib/sentry-options.ts';

/** Options consumed by withSentry for each Worker invocation. */
export function getEdgeSentryOptions(env) {
  return {
    dsn: env.SENTRY_DSN_EDGE,
    environment: env.ENVIRONMENT || 'production',
    release: env.GIT_COMMIT || 'unknown',
    tracesSampler: createSentrySampler(0.05),
    dataCollection: sentryDataCollection,
    beforeSend(event) {
      if (event.exception?.values?.[0]?.value?.includes('Turnstile')) {
        return null;
      }
      if (event.request?.cf) {
        event.contexts = {
          ...event.contexts,
          cloudflare: {
            colo: event.request.cf.colo,
            country: event.request.cf.country,
            city: event.request.cf.city,
            asn: event.request.cf.asn,
          },
        };
      }
      return event;
    },
  };
}

/** Return the SDK initialized and isolated by the Worker's withSentry wrapper. */
export function initEdgeSentry(_env) {
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
