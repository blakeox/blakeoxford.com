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

const ALLOWED_API_ORIGINS = new Set(['https://blakeoxford.com', 'https://www.blakeoxford.com']);

export function isAllowedApiOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || ALLOWED_API_ORIGINS.has(origin);
}

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
  const headers: Record<string, string> = {
    'access-control-allow-methods': options.methods || 'POST, OPTIONS',
    'access-control-allow-headers':
      options.allowHeaders || 'content-type, authorization, x-session-id',
    'access-control-expose-headers': API_EXPOSE_HEADERS,
    vary: 'Origin',
    ...(options.extra || {}),
  };

  if (requestOrigin && ALLOWED_API_ORIGINS.has(requestOrigin)) {
    headers['access-control-allow-origin'] = requestOrigin;
    headers['access-control-allow-credentials'] = 'true';
  }

  return headers;
}
