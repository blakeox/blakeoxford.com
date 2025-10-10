import * as Sentry from '@sentry/astro';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  
  // Environment & Release tracking
  environment: import.meta.env.MODE, // 'development' or 'production'
  release: `blakeoxford.com@${import.meta.env.PUBLIC_GIT_COMMIT || 'dev'}`,
  
  // Performance Monitoring - optimized for FREE TIER
  integrations: [
    Sentry.browserTracingIntegration({
      // Track navigation and interactions
      tracePropagationTargets: ['blakeoxford.com', /^\//],
    }),
    Sentry.replayIntegration({
      // Privacy-first session replay
      maskAllText: true, // Hide all user input text
      blockAllMedia: true, // Don't capture images/video
      maskAllInputs: true, // Extra protection for form fields
    }),
  ],
  
  // FREE TIER OPTIMIZATION: Low sample rates to stay under 5,000 errors/month
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  replaysSessionSampleRate: 0.05, // 5% of normal sessions (very conservative)
  replaysOnErrorSampleRate: 0.5, // 50% of sessions with errors (prioritize errors)
  
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
  allowUrls: [
    /https?:\/\/(.+\.)?blakeoxford\.com/,
  ],
  
  // Deny known bot/crawler user agents
  beforeSendTransaction(event) {
    const userAgent = event.request?.headers?.['user-agent'] || '';
    const isBot = /bot|crawler|spider|headless|lighthouse|gtmetrix|pagespeed/i.test(userAgent);
    
    if (isBot) {
      return null; // Don't track bots (saves quota)
    }
    
    return event;
  },
});
