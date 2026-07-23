import type { RouteContext } from '../shared/route-context';

export async function handleConversation({
  request,
  env,
  url,
}: RouteContext): Promise<Response | null> {
  if (!(url.pathname === '/api/conversation-ws' || url.pathname.startsWith('/api/conversation/'))) {
    return null;
  }

  try {
    const conversationId = url.searchParams.get('id') || 'default';
    const id = env.CONVERSATION_DO.idFromName(conversationId);
    const stub = env.CONVERSATION_DO.get(id);
    return stub.fetch(request);
  } catch (error) {
    console.error('Edge Worker: conversation Durable Object unavailable', error);
    const origin = request.headers.get('origin') || '*';
    return new Response(
      JSON.stringify({
        error: 'Conversation service unavailable',
        fallback: 'Use HTTP endpoints instead',
      }),
      {
        status: 503,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': origin,
          'access-control-allow-credentials': 'true',
        },
      }
    );
  }
}
