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
