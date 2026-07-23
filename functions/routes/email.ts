import { onRequestPost as handleSendEmail } from '../send-email.ts';
import type { RouteContext } from '../shared/route-context';

export async function handleEmail({
  request,
  env,
  ctx,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (!(url.pathname === '/send-email' && request.method === 'POST')) {
    return null;
  }

  const res = await handleSendEmail({
    request,
    env,
    waitUntil: (p: Promise<unknown>) => ctx.waitUntil(p),
    params: {},
    data: {},
    next: async () => new Response('Not found', { status: 404 }),
  });
  try {
    const h = new Headers(res.headers);
    h.set('x-request-id', reqId);
    h.set('x-route-kind', 'api');
    const cc = h.get('cache-control') || 'no-store';
    h.set('cache-control', cc);
    h.set('x-cache-policy', cc);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: h,
    });
  } catch {
    return res;
  }
}
