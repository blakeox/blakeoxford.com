import * as Sentry from '@sentry/astro';
import {
  createSentryAllowedUrls,
  createSentrySampler,
  scrubSentrySpan,
  sentryDataCollection,
} from '@/lib/sentry-options';
import { consumeEarlySentryEvents, type EarlySentryEvent } from './sentry-early';

function reportEarlySentryEvent(event: EarlySentryEvent): void {
  const { value } = event;
  if (value instanceof Error) {
    Sentry.captureException(value);
    return;
  }
  if (typeof value === 'string' && value.length > 0) {
    Sentry.captureMessage(value);
    return;
  }
  Sentry.captureException(new Error('Unclassified browser exception'));
}

/**
 * Browser SDK entry. Loaded with a dynamic import from the page loader so
 * React, zod, tracing, and replay stay off the critical path.
 */
export function initDeferredSentry(dsn = import.meta.env.PUBLIC_SENTRY_DSN): void {
  if (typeof window === 'undefined' || window.__boSentryReady) return;
  if (!dsn) return;

  const environment = import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || import.meta.env.MODE;
  const allowedUrls = createSentryAllowedUrls(environment);

  Sentry.init({
    dsn,
    environment,
    release: `blakeoxford.com@${import.meta.env.PUBLIC_GIT_COMMIT || 'dev'}`,
    dataCollection: sentryDataCollection,
    beforeSendSpan: scrubSentrySpan,
    tracePropagationTargets: [...allowedUrls, /^\//],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],
    tracesSampler: createSentrySampler(0.1, () => globalThis.navigator?.userAgent || ''),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    beforeSend(event) {
      if (import.meta.env.DEV) {
        console.log('Sentry event (dev only):', event);
        return null;
      }

      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
          delete event.request.headers['X-CSRF-Token'];
        }
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message) {
            breadcrumb.message = breadcrumb.message.replace(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
              '[EMAIL]'
            );
          }
          return breadcrumb;
        });
      }

      return event;
    },
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Non-Error exception captured',
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'Network request failed',
      'timeout exceeded',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'Script error.',
      'Turnstile',
    ],
    allowUrls: allowedUrls,
  });

  window.__boSentryReady = true;
  for (const event of consumeEarlySentryEvents()) reportEarlySentryEvent(event);
}
