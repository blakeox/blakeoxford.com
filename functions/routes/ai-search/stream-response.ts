import { anonymizeClientIp } from '../../shared/ip';
import type { Env } from '../../types';
import type { AiSourcePayload } from './types';

type StreamAiResponseOptions = {
  message: string;
  sources: AiSourcePayload[];
  baseCorsHeaders: Record<string, string>;
  startTime: number;
  complexity: string;
  query: string;
  enhancedQuery: string;
  finalCacheEnabled: boolean;
  cacheKey: string;
  clientIp: string;
  sessionId: string | null;
  env: Env;
};

export function buildAiSearchStreamResponse({
  message,
  sources,
  baseCorsHeaders,
  startTime,
  complexity,
  query,
  enhancedQuery,
  finalCacheEnabled,
  cacheKey,
  clientIp,
  sessionId,
  env,
}: StreamAiResponseOptions): Response {
  const streamHeaders = new Headers(baseCorsHeaders);
  streamHeaders.set('content-type', 'text/event-stream; charset=utf-8');
  streamHeaders.set('cache-control', 'no-store');
  streamHeaders.set('x-cache-status', 'MISS');
  streamHeaders.set('x-response-time', String(Date.now() - startTime));
  streamHeaders.set('x-query-complexity', complexity);
  streamHeaders.set('x-query-enhanced', String(query !== enhancedQuery));
  streamHeaders.set('x-ai-provider', 'autorag');

  const encoder = new globalThis.TextEncoder();
  const sleep = (ms: number) =>
    typeof globalThis.setTimeout === 'function'
      ? new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms))
      : Promise.resolve();
  const stream = new globalThis.ReadableStream({
    async start(controller) {
      const send = (eventName: string, data?: unknown) => {
        const payloadString = data !== undefined ? JSON.stringify(data) : '';
        const chunk = `event: ${eventName}\n${payloadString ? `data: ${payloadString}\n` : ''}\n`;
        controller.enqueue(encoder.encode(chunk));
      };
      send('ready');
      const tokens = message.split(/(\s+)/).filter((part: string) => Boolean(part));
      for (const token of tokens) {
        send('token', { text: token });
        await sleep(Math.min(120, 18 + token.length * 6));
      }
      if (Array.isArray(sources) && sources.length > 0) {
        send('sources', sources);
      }
      send('done', { message });
      controller.close();

      // Cache and log after streaming completes
      if (finalCacheEnabled && env.AI_RESPONSE_CACHE && message) {
        try {
          await env.AI_RESPONSE_CACHE.put(
            cacheKey,
            JSON.stringify({
              message,
              sources,
              timestamp: Date.now(),
            }),
            { expirationTtl: 7 * 24 * 60 * 60 }
          );
        } catch {
          // Cache write failed, continue anyway
        }
      }

      if (env.AI_ANALYTICS) {
        try {
          const responseTime = Date.now() - startTime;
          env.AI_ANALYTICS.writeDataPoint({
            blobs: [
              query.slice(0, 50),
              'API_CALL_STREAM',
              anonymizeClientIp(clientIp),
              sessionId || 'anonymous',
              complexity || 'unknown',
            ],
            doubles: [sources.length, message.length, responseTime],
            indexes: ['ai_query', `complexity_${complexity}`],
          });
        } catch {
          // Analytics write failed, continue anyway
        }
      }
    },
    cancel() {
      return undefined;
    },
  });
  return new Response(stream, { status: 200, headers: streamHeaders });
}
