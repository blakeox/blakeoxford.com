/**
 * Sentry configuration for Cloudflare Workers edge functions
 * Optimized for free tier with conservative sample rates
 */
import * as Sentry from '@sentry/cloudflare';
import { wrapRequestHandler } from '@sentry/cloudflare/request';
import {
  createSentrySampler,
  scrubSentrySpan,
  sentryDataCollection,
} from './src/lib/sentry-options.ts';

/** Options consumed by withSentry for each Worker invocation. */
export function getEdgeSentryOptions(env) {
  return {
    dsn: env.SENTRY_DSN_EDGE,
    environment: env.ENVIRONMENT || 'production',
    release: env.GIT_COMMIT || 'unknown',
    tracesSampler: createSentrySampler(0.05),
    dataCollection: sentryDataCollection,
    beforeSendSpan: scrubSentrySpan,
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

/** Initialize isolated error reporting even for methods withSentry skips. */
export function withEdgeSentry(optionsCallback, handler) {
  if (!handler.fetch) return Sentry.withSentry(optionsCallback, handler);
  const fetchHandler = handler.fetch;
  return Sentry.withSentry(optionsCallback, {
    ...handler,
    fetch(request, env, context) {
      const run = () => fetchHandler.call(handler, request, env, context);
      if (request.method === 'HEAD' || request.method === 'OPTIONS') {
        const options = optionsCallback(env);
        return wrapRequestHandler(
          {
            options: {
              ...options,
              defaultIntegrations:
                options.defaultIntegrations ?? Sentry.getDefaultIntegrations(options),
            },
            request,
            context,
          },
          run
        );
      }
      return run();
    },
  });
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
