import { isDirectHubQuery, isNoisyHubPage } from './hubPages';
import { loadSearchCorpus, filterByCategory } from './searchIndexLoader';
import { searchLocalCorpus } from './localSearch';
import { queryCloudflareSemanticSearch } from './semanticSearch';
import type { SearchQueryOptions, SearchQueryResult, SearchRecord } from './types';

function dedupeByHref(records: SearchRecord[]): SearchRecord[] {
  const seen = new Set<string>();
  const output: SearchRecord[] = [];

  for (const record of records) {
    if (seen.has(record.href)) continue;
    seen.add(record.href);
    output.push(record);
  }

  return output;
}

function mergeResults(
  primary: SearchRecord[],
  secondary: SearchRecord[],
  limit: number
): SearchRecord[] {
  return dedupeByHref([...primary, ...secondary]).slice(0, limit);
}

function markRetrieval(
  records: SearchRecord[],
  retrieval: NonNullable<SearchRecord['retrieval']>
): SearchRecord[] {
  return records.map((record) => ({ ...record, retrieval: record.retrieval ?? retrieval }));
}

function normalizeHrefKey(href: string): string {
  if (!href) return '/';
  try {
    const parsed = new URL(href, 'https://blakeoxford.com');
    return parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
  } catch {
    return href.startsWith('/') ? href : `/${href}`;
  }
}

function recordHaystack(record: SearchRecord): string {
  return `${record.title} ${record.description} ${record.tags.join(' ')}`.toLowerCase();
}

function hasQueryTermOverlap(record: SearchRecord, terms: string[]): boolean {
  if (!terms.length) return true;
  const haystack = recordHaystack(record);
  return terms.some((term) => haystack.includes(term));
}

/** Nav hub pages without a title hit are almost never the intent for keyword search. */
export function isNoisyHubRecord(record: SearchRecord, query: string): boolean {
  if (record.type !== 'page') return false;
  return isNoisyHubPage(
    record.title,
    record.href,
    query.toLowerCase().split(/\s+/).filter(Boolean)
  );
}

export function filterNoisyHubRecords(records: SearchRecord[], query: string): SearchRecord[] {
  return records.filter((record) => !isNoisyHubRecord(record, query));
}

/** Enrich semantic hits with local corpus fields (title, image, featured, description). */
export function hydrateRecordsFromCorpus(
  records: SearchRecord[],
  corpus: SearchRecord[]
): SearchRecord[] {
  if (!records.length || !corpus.length) return records;

  const byHref = new Map(corpus.map((item) => [normalizeHrefKey(item.href), item]));

  return records.map((record) => {
    const local = byHref.get(normalizeHrefKey(record.href));
    if (!local) return record;
    return {
      ...record,
      type: local.type,
      title: local.title || record.title,
      image: record.image || local.image,
      featured: record.featured ?? local.featured,
      description: record.excerpt || local.description || record.description,
      tags: local.tags.length ? local.tags : record.tags,
      publishedAt: record.publishedAt || local.publishedAt,
    };
  });
}

export async function runSearch(options: SearchQueryOptions): Promise<SearchQueryResult> {
  const { query, category, limit = 10, signal, onLocalResults } = options;
  const trimmed = query.trim();
  const corpus = await loadSearchCorpus();
  signal?.throwIfAborted();
  const local = markRetrieval(searchLocalCorpus(corpus, trimmed, category, limit), 'keyword');
  if (!trimmed)
    return { records: searchLocalCorpus(corpus, '', category, limit), source: 'browse' };
  if (category === 'pages') return { records: local, source: 'local-fallback' };
  onLocalResults?.(filterNoisyHubRecords(local, trimmed));

  try {
    const semantic = await queryCloudflareSemanticSearch(trimmed, limit, signal);
    signal?.throwIfAborted();
    const managed = semantic.meta.provider === 'ai-search';
    const remote = filterNoisyHubRecords(
      markRetrieval(
        hydrateRecordsFromCorpus(filterByCategory(semantic.records, category), corpus),
        managed ? 'hybrid' : 'semantic'
      ),
      trimmed
    );
    const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    const relevant = managed
      ? remote
      : remote.filter(
          (record) =>
            hasQueryTermOverlap(record, terms) ||
            ((record.score ?? 0) >= 0.85 && record.type !== 'page')
        );
    // Exact title destinations stay predictable; Cloudflare orders the remaining broader matches.
    const direct = local
      .filter(
        (record) =>
          record.title.toLowerCase().includes(trimmed.toLowerCase()) ||
          (record.type === 'page' && isDirectHubQuery(record.href, trimmed))
      )
      .sort(
        (a, b) =>
          Number(isDirectHubQuery(b.href, trimmed)) - Number(isDirectHubQuery(a.href, trimmed))
      );
    const records = filterNoisyHubRecords(
      mergeResults(
        direct,
        mergeResults(
          relevant,
          local.map((record) => ({ ...record, score: Math.min(0.5, (record.score ?? 0) * 0.5) })),
          limit
        ),
        limit
      ),
      trimmed
    );
    return {
      records,
      source: relevant.length
        ? managed
          ? 'cloudflare-ai-search'
          : 'cloudflare-vectorize'
        : 'local-fallback',
      meta: {
        provider: semantic.meta.provider,
        semanticCount: relevant.length,
        topScore: semantic.meta.topScore,
        responseTimeMs: semantic.meta.responseTimeMs,
      },
    };
  } catch (error) {
    signal?.throwIfAborted();
    console.warn('[search] Broader search unavailable; showing keyword matches');
    return {
      records: filterNoisyHubRecords(local, trimmed),
      source: 'local-fallback',
      meta: { degraded: true },
    };
  }
}
