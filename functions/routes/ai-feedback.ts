import { buildApiCorsHeaders, isAllowedApiOrigin } from '../shared/cors';
import type { RouteContext } from '../shared/route-context';

type RateLimitBucket = { count: number; reset: number };
type FeedbackPayload = {
  messageId?: unknown;
  sentiment?: unknown;
  query?: unknown;
  metadata?: unknown;
};

function isRateLimitBucket(value: unknown): value is RateLimitBucket {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as RateLimitBucket).count === 'number' &&
    typeof (value as RateLimitBucket).reset === 'number'
  );
}

async function checkFeedbackRateLimit(
  env: RouteContext['env'],
  clientIp: string
): Promise<'allowed' | 'limited' | 'unavailable'> {
  if (!env.RATE_LIMIT_KV) return 'unavailable';

  try {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const key = `ratelimit:feedback:${clientIp}`;
    const stored = await env.RATE_LIMIT_KV.get(key, 'json');
    const bucket = isRateLimitBucket(stored) ? stored : { count: 0, reset: now + windowMs };

    if (now > bucket.reset) {
      bucket.count = 0;
      bucket.reset = now + windowMs;
    }

    bucket.count += 1;
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(bucket), { expirationTtl: 120 });
    return bucket.count > 30 ? 'limited' : 'allowed';
  } catch (error) {
    console.error('AI feedback rate-limit storage failed', error);
    return 'unavailable';
  }
}

export async function handleAiFeedback({
  request,
  env,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (url.pathname !== '/api/ai-feedback') {
    return null;
  }

  const corsHeaders = buildApiCorsHeaders(request, {
    allowHeaders: 'content-type',
    extra: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': reqId,
      'x-route-kind': 'api',
      'x-cache-policy': 'no-store',
    },
  });

  if (!isAllowedApiOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  let payload: FeedbackPayload;
  try {
    payload = (await request.json()) as FeedbackPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const messageId = typeof payload?.messageId === 'string' ? payload.messageId.trim() : '';
  const sentiment =
    payload?.sentiment === 'positive' || payload?.sentiment === 'negative'
      ? payload.sentiment
      : undefined;
  const query = typeof payload?.query === 'string' ? payload.query.trim() : undefined;
  const metadata =
    payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};

  if (
    !messageId ||
    messageId.length > 128 ||
    !sentiment ||
    (query && query.length > 500) ||
    JSON.stringify(metadata).length > 2000
  ) {
    return new Response(JSON.stringify({ error: 'Feedback submission missing data' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const rateLimit = await checkFeedbackRateLimit(
    env,
    request.headers.get('cf-connecting-ip') || 'unknown'
  );
  if (rateLimit === 'limited') {
    return new Response(JSON.stringify({ error: 'Feedback rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders, 'retry-after': '60' },
    });
  }
  if (rateLimit === 'unavailable') {
    return new Response(JSON.stringify({ error: 'Feedback service unavailable' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  const record = {
    id: messageId,
    sentiment,
    query,
    metadata,
    ts: Date.now(),
  };

  try {
    if (!env.AI_FEEDBACK_KV || typeof env.AI_FEEDBACK_KV.put !== 'function') {
      throw new Error('AI feedback storage is not configured');
    }
    const key = `feedback:${record.ts}:${record.id}`;
    await env.AI_FEEDBACK_KV.put(key, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    console.error('AI feedback storage failed', error);
    return new Response(JSON.stringify({ error: 'Feedback service unavailable' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: corsHeaders });
}
