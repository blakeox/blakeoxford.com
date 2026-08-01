import type { RouteContext } from '../shared/route-context';
import { buildApiCorsHeaders, isAllowedApiOrigin } from '../shared/cors';

export async function handleConversation({
  request,
  env,
  url,
}: RouteContext): Promise<Response | null> {
  if (!(url.pathname === '/api/conversation-ws' || url.pathname.startsWith('/api/conversation/'))) {
    return null;
  }

  const corsHeaders = buildApiCorsHeaders(request, {
    methods: 'GET, POST, OPTIONS',
    allowHeaders: 'content-type, x-session-id',
    extra: { 'content-type': 'application/json; charset=utf-8' },
  });

  if (!isAllowedApiOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const conversationId = url.searchParams.get('id') || 'default';
    const id = env.CONVERSATION_DO.idFromName(conversationId);
    const stub = env.CONVERSATION_DO.get(id);
    return stub.fetch(request);
  } catch (error) {
    console.error('Edge Worker: conversation Durable Object unavailable', error);
    return new Response(
      JSON.stringify({
        error: 'Conversation service unavailable',
        fallback: 'Use HTTP endpoints instead',
      }),
      {
        status: 503,
        headers: corsHeaders,
      }
    );
  }
}
