import type { SearchRecord, SemanticSearchMatch } from './types';

const SEMANTIC_SEARCH_ENDPOINT = '/api/semantic-search';

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
): Promise<SearchRecord[]> {
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

  const data = await response.json() as { results?: SemanticSearchMatch[] };
  return (data.results ?? []).map(mapSemanticMatch);
}
