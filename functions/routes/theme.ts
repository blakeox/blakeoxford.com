import type { RouteContext } from '../shared/route-context';
import { isBlakeOxfordHostname } from '../shared/hostname';

export async function handleTheme({
  request,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (url.pathname !== '/api/set-theme') {
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

  const theme =
    typeof payload?.theme === 'string' &&
    (payload.theme === 'light' || payload.theme === 'dark' || payload.theme === 'system')
      ? payload.theme
      : null;
  if (!theme) {
    return new Response(JSON.stringify({ error: 'Invalid theme value' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const maxAge = 60 * 60 * 24 * 365;
    const isProd = Boolean(url.hostname && isBlakeOxfordHostname(url.hostname));
    const secureFlag = isProd ? '; Secure' : '';
    const cookie = `theme=${encodeURIComponent(theme)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly${secureFlag}`;
    const headers = new Headers(corsHeaders);
    headers.append('Set-Cookie', cookie);
    return new Response(JSON.stringify({ status: 'ok', theme }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to set theme cookie' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
