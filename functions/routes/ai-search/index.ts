import { anonymizeClientIp } from '../../shared/ip';
import { buildApiCorsHeaders } from '../../shared/cors';
import type { RouteContext } from '../../shared/route-context';
import type { Env } from '../../types';
import { parseAiSources } from './parse-sources';
import { checkAiSearchRateLimit } from './rate-limit';
import {
  isCacheEligibleQuery,
  isConversationalProfileAsk,
  normalizeForCache,
  rewriteAskQuery,
} from './rewrite-query';
import { buildAiSearchStreamResponse } from './stream-response';
import {
  extractQuery,
  isCachedAiResponse,
  parseHistory,
  parsePageContext,
  type AiSearchPayload,
} from './types';
import { handleSimpleQueryWithWorkersAI, looksLikeEmptyRetrieval } from './workers-ai';

export async function handleAiSearch({
  request,
  env,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (url.pathname !== '/api/ai-search') {
    return null;
  }

  const startTime = Date.now();
  const baseCorsHeaders = {
    ...buildApiCorsHeaders(request, {
      extra: {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-request-id': reqId,
        'x-route-kind': 'api',
        'x-cache-policy': 'no-store',
      },
    }),
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseCorsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: baseCorsHeaders,
    });
  }

  let payload: AiSearchPayload;
  try {
    payload = (await request.json()) as AiSearchPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: baseCorsHeaders,
    });
  }

  const query = extractQuery(payload);
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: baseCorsHeaders,
    });
  }

  // Optional page context from the docked Ask companion (generation hint only — never retrieval)
  const pageContext = parsePageContext(payload.pageContext);

  const {
    retrievalQuery,
    generationQuery,
    complexity,
    shouldUseCache: enhancedCacheFlag,
  } = rewriteAskQuery(query, pageContext);
  const enhancedQuery = retrievalQuery;

  // Enhanced rate limiting with per-IP and per-session limits
  const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
  const sessionId = request.headers.get('x-session-id') || null;

  const rateLimit = await checkAiSearchRateLimit(env, clientIp, sessionId);
  if (rateLimit.limited) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded. Please wait a moment before trying again.',
        resetIn: rateLimit.resetIn,
      }),
      {
        status: 429,
        headers: {
          ...baseCorsHeaders,
          'retry-after': String(rateLimit.resetIn),
          'x-rate-limit-reason': rateLimit.reason,
          'x-rate-limit-remaining': '0',
        },
      }
    );
  }

  const history = parseHistory(payload.history);

  const cacheKey = `ai:response:v4:${normalizeForCache(query)}`;
  const finalCacheEnabled = isCacheEligibleQuery(query) && enhancedCacheFlag;

  // Conversational Blake-profile questions: answer with Workers AI from verified expertise.
  // AutoRAG retrieval often fails on pronouns / soft phrasing ("What does he do well").
  if ((complexity === 'simple' || isConversationalProfileAsk(query)) && env.AI) {
    const workersAIResult = await handleSimpleQueryWithWorkersAI(generationQuery, history, env);

    if (workersAIResult) {
      const responseHeaders = {
        ...baseCorsHeaders,
        'x-query-complexity': complexity,
        'x-ai-provider': 'workers-ai',
        'x-cache-status': 'N/A',
        'x-response-time': String(Date.now() - startTime),
      };

      // Log to analytics
      if (env.AI_ANALYTICS) {
        try {
          env.AI_ANALYTICS.writeDataPoint({
            blobs: [
              query.slice(0, 50),
              'WORKERS_AI',
              anonymizeClientIp(clientIp),
              sessionId || 'anonymous',
              complexity,
            ],
            doubles: [
              0, // No sources from Workers AI
              workersAIResult.message?.length || 0,
              Date.now() - startTime,
            ],
            indexes: ['workers_ai', `complexity_${complexity}`],
          });
        } catch {
          // Silently fail - analytics is non-critical
        }
      }

      return new Response(JSON.stringify(workersAIResult), {
        status: 200,
        headers: responseHeaders,
      });
    }
  }

  // Try to get cached response
  if (finalCacheEnabled && env.AI_RESPONSE_CACHE) {
    try {
      const cachedRaw = await env.AI_RESPONSE_CACHE.get(cacheKey, 'json');
      const cached = isCachedAiResponse(cachedRaw) ? cachedRaw : null;
      const cachedTimestamp = typeof cached?.timestamp === 'number' ? cached.timestamp : 0;
      if (
        cached &&
        typeof cached.message === 'string' &&
        cached.message &&
        Date.now() - cachedTimestamp < 7 * 24 * 60 * 60 * 1000
      ) {
        // 7 days
        const responseData = {
          message: cached.message,
          sources: cached.sources || [],
          fromCache: true,
          cachedAt: cachedTimestamp,
        };

        const cacheHeaders = {
          ...baseCorsHeaders,
          'x-cache-status': 'HIT',
          'x-cache-age': String(Math.floor((Date.now() - cachedTimestamp) / 1000)),
          'x-query-complexity': complexity,
          'x-ai-provider': 'autorag-cached',
        };

        // Log cache hit to analytics
        if (env.AI_ANALYTICS) {
          try {
            env.AI_ANALYTICS.writeDataPoint({
              blobs: [
                query.slice(0, 50),
                'CACHE_HIT',
                anonymizeClientIp(clientIp),
                sessionId || 'anonymous',
                complexity || 'unknown',
              ],
              doubles: [
                Array.isArray(cached.sources) ? cached.sources.length : 0,
                cached.message.length || 0,
                Date.now() - startTime,
              ],
              indexes: ['cache_hit', `complexity_${complexity}`],
            });
          } catch {
            // Silently fail - analytics is non-critical
          }
        }

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: cacheHeaders,
        });
      }
    } catch {
      // Cache read failed, continue to AutoRAG call
    }
  }

  const upstreamEndpoint = env.AI_SEARCH_API_ENDPOINT;
  const upstreamToken =
    env.AI_SEARCH_API_TOKEN || (env as Env & { 'search-api'?: string })['search-api'];

  const wantsStream =
    payload.stream === true ||
    (request.headers.get('accept') || '').toLowerCase().includes('text/event-stream');

  if (!upstreamEndpoint || !upstreamToken) {
    return new Response(JSON.stringify({ error: 'AI search service not configured' }), {
      status: 503,
      headers: baseCorsHeaders,
    });
  }

  try {
    const requestBody = { query: enhancedQuery, history };

    // Optional AI Gateway: attach observability headers when configured.
    // Keep the AutoRAG endpoint URL (gateway URL rewrite is provider-specific).
    // Enable by setting AI_GATEWAY_ID + AI_GATEWAY_ACCOUNT_ID in wrangler.toml.
    const fetchUrl = upstreamEndpoint;
    const fetchHeaders: Record<string, string> = {
      'content-type': 'application/json',
      authorization: `Bearer ${upstreamToken}`,
    };

    if (env.AI_GATEWAY_ID && env.AI_GATEWAY_ACCOUNT_ID) {
      fetchHeaders['cf-aig-cache-ttl'] = '3600';
      fetchHeaders['cf-aig-metadata'] = JSON.stringify({
        user: sessionId || 'anonymous',
        source: 'website-chat',
        complexity,
        enhanced: query !== enhancedQuery,
        gateway: env.AI_GATEWAY_ID,
        account: env.AI_GATEWAY_ACCOUNT_ID,
      });
    }

    const upstreamResponse = await fetch(fetchUrl, {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify(requestBody),
      cf: { cacheTtl: 0, cacheEverything: false },
    });

    if (!upstreamResponse.ok) {
      let errorDetail = 'Upstream service error';
      try {
        const upstreamError = (await upstreamResponse.json()) as { error?: unknown };
        if (typeof upstreamError?.error === 'string') {
          errorDetail = upstreamError.error;
        }
      } catch {
        const upstreamText = await upstreamResponse.text();
        if (upstreamText) errorDetail = upstreamText.slice(0, 200);
      }
      return new Response(JSON.stringify({ error: errorDetail }), {
        status: upstreamResponse.status,
        headers: baseCorsHeaders,
      });
    }

    let upstreamData: Record<string, unknown>;
    try {
      upstreamData = (await upstreamResponse.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), {
        status: 502,
        headers: baseCorsHeaders,
      });
    }

    if (upstreamData && typeof upstreamData === 'object' && upstreamData.success === false) {
      const errors = Array.isArray(upstreamData.errors) ? upstreamData.errors : [];
      const firstError =
        errors[0] && typeof errors[0] === 'object'
          ? (errors[0] as { message?: unknown })
          : null;
      const upstreamError =
        typeof firstError?.message === 'string'
          ? firstError.message
          : 'AI search service reported an error';
      return new Response(JSON.stringify({ error: upstreamError }), {
        status: 502,
        headers: baseCorsHeaders,
      });
    }

    const result =
      upstreamData.result && typeof upstreamData.result === 'object'
        ? (upstreamData.result as Record<string, unknown>)
        : upstreamData;
    const message =
      typeof result.response === 'string'
        ? result.response.trim()
        : typeof upstreamData.response === 'string'
          ? upstreamData.response.trim()
          : '';

    const resultData = Array.isArray(result.data) ? result.data : [];
    const sources = parseAiSources(resultData);

    if (!message) {
      return new Response(JSON.stringify({ error: 'AI service returned no message' }), {
        status: 502,
        headers: baseCorsHeaders,
      });
    }

    // AutoRAG empty-retrieval refusals → conversational Workers AI fallback
    if (looksLikeEmptyRetrieval(message, sources.length) && env.AI) {
      const fallback = await handleSimpleQueryWithWorkersAI(generationQuery, history, env);
      if (fallback?.message) {
        return new Response(JSON.stringify(fallback), {
          status: 200,
          headers: {
            ...baseCorsHeaders,
            'x-query-complexity': complexity,
            'x-ai-provider': 'workers-ai',
            'x-cache-status': 'MISS',
            'x-response-time': String(Date.now() - startTime),
            'x-query-enhanced': String(query !== enhancedQuery),
          },
        });
      }
    }

    if (wantsStream) {
      return buildAiSearchStreamResponse({
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
      });
    }

    const responsePayload = JSON.stringify({ message, sources });

    // Cache the response for future queries
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
        ); // 7 days
      } catch {
        // Cache write failed, continue anyway
      }
    }

    // Log successful query to analytics
    if (env.AI_ANALYTICS) {
      try {
        const responseTime = Date.now() - startTime;
        env.AI_ANALYTICS.writeDataPoint({
          blobs: [
            query.slice(0, 50),
            'API_CALL',
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

    const responseHeaders = {
      ...baseCorsHeaders,
      'x-cache-status': 'MISS',
      'x-response-time': String(Date.now() - startTime),
      'x-query-complexity': complexity,
      'x-query-enhanced': String(query !== enhancedQuery),
      'x-ai-provider': 'autorag',
    };

    return new Response(responsePayload, { status: 200, headers: responseHeaders });
  } catch (error) {
    let errorMessage = 'AI search request failed';
    if (error instanceof Error && error.name === 'AbortError') {
      errorMessage = 'AI search request timed out';
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 504,
      headers: baseCorsHeaders,
    });
  }
}
