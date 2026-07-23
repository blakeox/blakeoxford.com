export const API_EXPOSE_HEADERS = [
  'x-ai-provider',
  'x-cache-status',
  'x-query-complexity',
  'x-response-time',
  'x-rate-limit-reason',
  'x-rate-limit-remaining',
  'x-search-provider',
  'x-request-id',
  'retry-after',
].join(',');

/**
 * Same-origin friendly CORS headers. Never pairs `*` with credentials.
 */
export function buildApiCorsHeaders(
  request: Request,
  options: {
    methods?: string;
    allowHeaders?: string;
    extra?: Record<string, string>;
  } = {}
): Record<string, string> {
  const requestOrigin = request.headers.get('origin');
  const allowOrigin =
    requestOrigin && requestOrigin !== 'null' ? requestOrigin : new URL(request.url).origin;
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': options.methods || 'POST, OPTIONS',
    'access-control-allow-headers':
      options.allowHeaders || 'content-type, authorization, x-session-id',
    'access-control-expose-headers': API_EXPOSE_HEADERS,
    vary: 'Origin',
    ...(options.extra || {}),
  };
}
