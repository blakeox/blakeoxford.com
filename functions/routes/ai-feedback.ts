import type { RouteContext } from '../shared/route-context';

export async function handleAiFeedback({
  request,
  env,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (url.pathname !== '/api/ai-feedback') {
    return null;
  }

  const origin = request.headers.get('origin') || '*';
  const corsHeaders = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'Origin',
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'x-request-id': reqId,
    'x-route-kind': 'api',
    'x-cache-policy': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  let payload;
  try {
    payload = await request.json();
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
  const query = typeof payload?.query === 'string' ? payload.query.slice(0, 500) : undefined;
  const metadata =
    payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};

  if (!messageId || !sentiment) {
    return new Response(JSON.stringify({ error: 'Feedback submission missing data' }), {
      status: 400,
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
    if (env.AI_FEEDBACK_KV && typeof env.AI_FEEDBACK_KV.put === 'function') {
      const key = `feedback:${record.ts}:${record.id}`;
      await env.AI_FEEDBACK_KV.put(key, JSON.stringify(record), {
        expirationTtl: 60 * 60 * 24 * 30,
      });
    } else {
      console.log('AI feedback event', JSON.stringify(record));
    }
  } catch (error) {
    console.error('AI feedback storage failed', error);
  }

  return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: corsHeaders });
}
