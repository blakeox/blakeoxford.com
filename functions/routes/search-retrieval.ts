import type { AiSearchInstance } from '../types';

export const MANAGED_SEARCH_TIMEOUT_MS = 8000;

export class SearchRetrievalError extends Error {
  constructor(readonly reason: 'timeout' | 'invalid_response') {
    super(reason === 'timeout' ? 'Search deadline exceeded' : 'Invalid search response');
    this.name = 'SearchRetrievalError';
  }
}

export type SiteSearchMatch = {
  id: string;
  score: number;
  title: string;
  description: string;
  excerpt?: string;
  url: string;
  collection: string;
  tags: string[];
  date?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Only published site URLs may become navigable search results. */
export function siteSearchPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, 'https://blakeoxford.com');
    if (
      !['blakeoxford.com', 'www.blakeoxford.com'].includes(url.hostname) ||
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const path = url.pathname;
    if (/^\/(api|assets|components|design|search)(\/|$)/.test(path) || /\.[a-z0-9]+$/i.test(path))
      return null;
    return path === '/' ? path : `${path.replace(/\/+$/, '')}/`;
  } catch {
    return null;
  }
}

function plainExcerpt(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[#*_`>|]/g, '')
    .replace(/&(amp|quot|#39);/g, (_match, entity: string) =>
      entity === 'amp' ? '&' : entity === 'quot' ? '"' : "'"
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
}

export function mapAiSearchChunks(payload: unknown, limit: number): SiteSearchMatch[] {
  const root = asRecord(payload);
  const chunks = root.chunks ?? asRecord(root.result).chunks;
  if (!Array.isArray(chunks)) throw new SearchRetrievalError('invalid_response');
  const matches = new Map<string, SiteSearchMatch>();
  for (const raw of chunks) {
    const chunk = asRecord(raw);
    const item = asRecord(chunk.item);
    const meta = asRecord(item.metadata);
    const path = siteSearchPath(meta.url ?? meta.source_url ?? item.key);
    if (
      !path ||
      typeof chunk.score !== 'number' ||
      !Number.isFinite(chunk.score) ||
      chunk.score < 0 ||
      chunk.score > 1
    )
      continue;
    const existing = matches.get(path);
    if (existing && existing.score >= chunk.score) continue;
    const excerpt = plainExcerpt(chunk.text);
    matches.set(path, {
      id: typeof chunk.id === 'string' ? chunk.id : path,
      score: chunk.score,
      title:
        plainExcerpt(meta.title) ||
        path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ||
        'Home',
      description: plainExcerpt(meta.description),
      ...(excerpt ? { excerpt } : {}),
      url: path,
      collection: path.startsWith('/projects/')
        ? 'project'
        : path.startsWith('/blog/')
          ? 'blog'
          : 'page',
      tags: Array.isArray(meta.tags)
        ? meta.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      ...(typeof meta.publishedAt === 'string' ? { date: meta.publishedAt } : {}),
    });
  }
  return [...matches.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function retrieveSiteSearch(
  instance: AiSearchInstance,
  query: string,
  limit: number
): Promise<SiteSearchMatch[]> {
  if (!instance.search) throw new Error('Search binding unavailable');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      instance.search({
        messages: [{ role: 'user', content: query }],
        ai_search_options: {
          retrieval: { retrieval_type: 'hybrid', max_num_results: Math.min(36, limit * 3) },
          query_rewrite: { enabled: false },
          reranking: { enabled: true },
        },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new SearchRetrievalError('timeout')),
          MANAGED_SEARCH_TIMEOUT_MS
        );
      }),
    ]);
    return mapAiSearchChunks(response, limit);
  } finally {
    clearTimeout(timer);
  }
}
