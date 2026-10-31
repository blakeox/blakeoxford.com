import * as Sentry from '@sentry/astro';
import {
  createSentrySampler,
  scrubSentrySpan,
  sentryDataCollection,
} from './src/lib/sentry-options';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,

  // Environment & Release tracking
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: `blakeoxford.com@${import.meta.env.PUBLIC_GIT_COMMIT || 'dev'}`,
  dataCollection: sentryDataCollection,
  beforeSendSpan: scrubSentrySpan,
  tracePropagationTargets: ['blakeoxford.com', /^\//],

  // Performance Monitoring - optimized for FREE TIER
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Privacy-first session replay
      maskAllText: true, // Hide all user input text
      blockAllMedia: true, // Don't capture images/video
      maskAllInputs: true, // Extra protection for form fields
    }),
  ],

  // FREE TIER OPTIMIZATION: Low sample rates to stay under free quotas
  tracesSampler: createSentrySampler(0.1, () => globalThis.navigator?.userAgent || ''),
  // Clarity owns continuous session replay; Sentry only records on errors
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5, // 50% of sessions with errors

  // Privacy & Security
  beforeSend(event) {
    // Don't send events in development
    if (import.meta.env.DEV) {
      console.log('Sentry event (dev only):', event);
      return null;
    }

    // Scrub sensitive data from requests
    if (event.request) {
      // Remove cookies and auth headers
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
        delete event.request.headers['X-CSRF-Token'];
      }
    }

    // Scrub email addresses and potential PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.message) {
          // Simple email regex replacement
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

  // Ignore known browser noise and extension errors
  ignoreErrors: [
    // Browser/Extension errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'Non-Error exception captured',
    // Network errors users can't control
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    'Network request failed',
    'timeout exceeded',
    // Browser extension interference
    'Extension context invalidated',
    'chrome-extension://',
    'moz-extension://',
    // Third-party script errors
    'Script error.',
    // Cloudflare Turnstile expected errors
    'Turnstile',
  ],

  // Only capture from your domain (prevent abuse)
  allowUrls: [/https?:\/\/(.+\.)?blakeoxford\.com/],
});
