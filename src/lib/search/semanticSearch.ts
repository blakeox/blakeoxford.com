import type { SearchRecord, SemanticSearchMatch } from './types';

const SEMANTIC_SEARCH_ENDPOINT = '/api/semantic-search';

export type SemanticSearchMeta = {
  provider?: string;
  count?: number;
  topScore?: number;
  responseTimeMs?: number;
};

export type SemanticSearchResult = {
  records: SearchRecord[];
  meta: SemanticSearchMeta;
};

function normalizeUrl(url: string): string {
  if (!url) return '/';
  try {
    const parsed = new URL(url, 'https://blakeoxford.com');
    return parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
}

function collectionToType(collection: string): SearchRecord['type'] {
  const normalized = collection.toLowerCase();
  if (normalized.includes('blog')) return 'blog';
  if (normalized.includes('project')) return 'project';
  if (normalized.includes('page')) return 'page';
  return 'project';
}

export function mapSemanticMatch(match: SemanticSearchMatch): SearchRecord {
  const type = collectionToType(match.collection);
  const href = normalizeUrl(match.url);

  return {
    type,
    title: match.title || 'Untitled',
    description: match.description || '',
    href,
    tags: Array.isArray(match.tags) ? match.tags : [],
    score: match.score,
    publishedAt: match.date,
  };
}

export async function queryCloudflareSemanticSearch(
  query: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<SemanticSearchResult> {
  const response = await fetch(SEMANTIC_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof payload?.error === 'string' ? payload.error : `Semantic search failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json() as {
    results?: SemanticSearchMatch[];
    count?: number;
    provider?: string;
    topScore?: number;
  };
  const records = (data.results ?? []).map(mapSemanticMatch);
  const responseTimeHeader = response.headers.get('x-response-time');
  const responseTimeMs = responseTimeHeader && Number.isFinite(Number(responseTimeHeader))
    ? Number(responseTimeHeader)
    : undefined;

  return {
    records,
    meta: {
      provider: data.provider || response.headers.get('x-search-provider') || 'vectorize',
      count: typeof data.count === 'number' ? data.count : records.length,
      topScore: typeof data.topScore === 'number' ? data.topScore : records[0]?.score,
      ...(responseTimeMs !== undefined ? { responseTimeMs } : {}),
    },
  };
}
