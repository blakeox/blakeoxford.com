/**
 * Type declarations for the JS Sentry edge config module.
 */
export function initEdgeSentry(env: unknown): {
  captureException(error: unknown, context?: unknown): void;
  [key: string]: unknown;
};

export function addEdgeBreadcrumb(breadcrumb: {
  category?: string;
  message?: string;
  level?: string;
  data?: Record<string, unknown>;
}): void;

export function getEdgeSentryOptions(env: {
  SENTRY_DSN_EDGE?: string;
  ENVIRONMENT?: string;
  GIT_COMMIT?: string;
}): import('@sentry/cloudflare').CloudflareOptions;
