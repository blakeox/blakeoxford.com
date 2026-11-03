import { retrieveSiteSearch, SearchRetrievalError, type SiteSearchMatch } from './search-retrieval';
import { buildApiCorsHeaders } from '../shared/cors';
import { writeAiAnalytics } from '../shared/ai-analytics';
import type { RouteContext } from '../shared/route-context';

const MAX_REQUEST_BYTES = 8 * 1024;
const MAX_QUERY_LENGTH = 500;

type RateLimitBucket = { count: number; reset: number };

function isRateLimitBucket(value: unknown): value is RateLimitBucket {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as RateLimitBucket).count === 'number' &&
    typeof (value as RateLimitBucket).reset === 'number'
  );
}

export async function handleSemanticSearch({
  request,
  env,
  url,
  reqId,
}: RouteContext): Promise<Response | null> {
  if (url.pathname !== '/api/semantic-search') {
    return null;
  }

  const startTime = Date.now();
  const baseCorsHeaders = {
    ...buildApiCorsHeaders(request, {
      allowHeaders: 'content-type, x-session-id',
      extra: {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-request-id': reqId,
        'x-route-kind': 'api',
        'x-cache-policy': 'no-store',
        'x-search-provider': 'unavailable',
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

  function searchResponse(results: SiteSearchMatch[], provider: 'ai-search' | 'vectorize') {
    const latency = Date.now() - startTime;
    const topScore = results[0]?.score ?? 0;
    writeAiAnalytics(env, {
      blobs: ['', provider, '', 'anonymous'],
      doubles: [results.length, topScore, latency],
      indexes: ['site_search'],
    });
    return new Response(JSON.stringify({ results, count: results.length, provider, topScore }), {
      status: 200,
      headers: {
        ...baseCorsHeaders,
        'x-search-provider': provider,
        'x-response-time': String(latency),
      },
    });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return new Response(JSON.stringify({ error: 'Request is too large' }), {
      status: 413,
      headers: baseCorsHeaders,
    });
  }

  try {
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

    // Light rate limit for Find (higher than Ask — typing fires often)
    if (env.RATE_LIMIT_KV) {
      const now = Date.now();
      const windowMs = 60 * 1000;
      const ipKey = `ratelimit:search:ip:${clientIp}`;
      const ipData = await env.RATE_LIMIT_KV.get(ipKey, 'json');
      const ipCount: RateLimitBucket = isRateLimitBucket(ipData)
        ? ipData
        : { count: 0, reset: now + windowMs };
      if (now > ipCount.reset) {
        ipCount.count = 0;
        ipCount.reset = now + windowMs;
      }
      ipCount.count++;
      await env.RATE_LIMIT_KV.put(ipKey, JSON.stringify(ipCount), { expirationTtl: 120 });
      if (ipCount.count > 60) {
        const resetIn = Math.ceil((ipCount.reset - now) / 1000);
        return new Response(
          JSON.stringify({
            error: 'Search rate limit exceeded. Please wait a moment.',
            resetIn,
          }),
          {
            status: 429,
            headers: {
              ...baseCorsHeaders,
              'retry-after': String(resetIn),
              'x-rate-limit-reason': 'ip',
              'x-rate-limit-remaining': '0',
            },
          }
        );
      }
    }

    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_REQUEST_BYTES)
      return new Response(JSON.stringify({ error: 'Request is too large' }), {
        status: 413,
        headers: baseCorsHeaders,
      });
    let body: { query?: unknown; limit?: unknown };
    try {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('Invalid JSON');
      body = parsed;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid search request' }), {
        status: 400,
        headers: baseCorsHeaders,
      });
    }
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const requestedLimit =
      typeof body.limit === 'number' && Number.isFinite(body.limit) ? Math.floor(body.limit) : 5;
    const limit = Math.max(1, Math.min(requestedLimit, 12));

    if (!query || query.length > MAX_QUERY_LENGTH) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: baseCorsHeaders,
      });
    }

    if (env.SEARCH_PROVIDER === 'local') {
      return new Response(JSON.stringify({ error: 'Broader search is temporarily unavailable' }), {
        status: 503,
        headers: baseCorsHeaders,
      });
    }
    if (env.AI_SEARCH?.search && env.SEARCH_PROVIDER !== 'vectorize') {
      try {
        const results = await retrieveSiteSearch(env.AI_SEARCH, query, limit);
        return searchResponse(results, 'ai-search');
      } catch (error) {
        console.warn('[search] Managed retrieval unavailable; trying fallback', {
          reqId,
          reason: error instanceof SearchRetrievalError ? error.reason : 'provider_error',
          elapsedMs: Date.now() - startTime,
        });
      }
    }

    // Check if Vectorize is available
    if (!env.VECTORIZE) {
      return new Response(
        JSON.stringify({
          error: 'Semantic search not configured',
          fallback: 'using-keyword-search',
        }),
        {
          status: 503,
          headers: baseCorsHeaders,
        }
      );
    }

    // Generate embedding for query using Workers AI
    let queryEmbedding: number[];
    try {
      const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [query],
      });
      const embeddingData =
        embeddingResponse &&
        typeof embeddingResponse === 'object' &&
        Array.isArray((embeddingResponse as { data?: unknown }).data)
          ? ((embeddingResponse as { data: unknown[] }).data[0] as unknown)
          : null;
      if (!Array.isArray(embeddingData) || !embeddingData.every((n) => typeof n === 'number')) {
        throw new Error('Invalid embedding response shape');
      }
      queryEmbedding = embeddingData;
    } catch (error) {
      console.warn('[search] Fallback embedding unavailable', { reqId });
      return new Response(JSON.stringify({ error: 'Failed to generate query embedding' }), {
        status: 500,
        headers: baseCorsHeaders,
      });
    }

    // Query Vectorize index
    const vectorizeResults = await env.VECTORIZE.query(queryEmbedding, {
      topK: Math.min(limit, 10),
      returnMetadata: true,
      returnValues: false,
    });

    // Format results
    const results = vectorizeResults.matches.map((match) => {
      const meta = match.metadata ?? {};
      const tagsRaw = meta.tags;
      const tags =
        typeof tagsRaw === 'string'
          ? tagsRaw.split(',')
          : Array.isArray(tagsRaw)
            ? tagsRaw.map(String)
            : [];
      return {
        id: match.id,
        score: match.score,
        title: typeof meta.title === 'string' ? meta.title : '',
        description: typeof meta.description === 'string' ? meta.description : '',
        url: typeof meta.url === 'string' ? meta.url : '',
        collection: typeof meta.collection === 'string' ? meta.collection : '',
        tags,
        date: typeof meta.date === 'string' ? meta.date : '',
      };
    });

    return searchResponse(results, 'vectorize');
  } catch (error) {
    console.warn('[search] Retrieval failed', { reqId });
    return new Response(JSON.stringify({ error: 'Semantic search failed' }), {
      status: 500,
      headers: baseCorsHeaders,
    });
  }
}
