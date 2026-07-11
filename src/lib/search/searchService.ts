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

function mergeResults(primary: SearchRecord[], secondary: SearchRecord[], limit: number): SearchRecord[] {
  return dedupeByHref([...primary, ...secondary]).slice(0, limit);
}

function markRetrieval(
  records: SearchRecord[],
  retrieval: NonNullable<SearchRecord['retrieval']>,
): SearchRecord[] {
  return records.map((record) => ({ ...record, retrieval: record.retrieval ?? retrieval }));
}

const HUB_PAGE_TITLES = new Set(['home', 'about', 'projects', 'blog', 'contact', 'pages']);

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
  const title = record.title.trim().toLowerCase();
  if (!HUB_PAGE_TITLES.has(title)) return false;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return !terms.some((term) => title.includes(term));
}

export function filterNoisyHubRecords(records: SearchRecord[], query: string): SearchRecord[] {
  return records.filter((record) => !isNoisyHubRecord(record, query));
}

/** Enrich semantic hits with local corpus fields (title, image, featured, description). */
export function hydrateRecordsFromCorpus(
  records: SearchRecord[],
  corpus: SearchRecord[],
): SearchRecord[] {
  if (!records.length || !corpus.length) return records;

  const byHref = new Map(corpus.map((item) => [normalizeHrefKey(item.href), item]));

  return records.map((record) => {
    const local = byHref.get(normalizeHrefKey(record.href));
    if (!local) return record;
    return {
      ...record,
      title: local.title || record.title,
      image: record.image || local.image,
      featured: record.featured ?? local.featured,
      description: local.description || record.description,
      tags: local.tags.length ? local.tags : record.tags,
      publishedAt: record.publishedAt || local.publishedAt,
    };
  });
}

export async function runSearch(options: SearchQueryOptions): Promise<SearchQueryResult> {
  const { query, category, limit = 10, signal } = options;
  const trimmed = query.trim();
  const corpus = await loadSearchCorpus(signal);

  if (!trimmed) {
    return {
      records: searchLocalCorpus(corpus, '', category, limit),
      source: 'browse',
    };
  }

  const localAll = markRetrieval(searchLocalCorpus(corpus, trimmed, category, limit), 'keyword');
  const localPages = markRetrieval(searchLocalCorpus(corpus, trimmed, 'pages', 5), 'keyword');

  if (category === 'pages') {
    return {
      records: searchLocalCorpus(corpus, trimmed, 'pages', limit),
      source: 'local-fallback',
    };
  }

  try {
    const semantic = await queryCloudflareSemanticSearch(trimmed, limit, signal);
    const semanticResults = semantic.records;
    const semanticMeta = semantic.meta;
    const filteredSemantic = filterByCategory(
      semanticResults,
      category === 'all' ? 'all' : category,
    );
    const hydrated = filterNoisyHubRecords(
      markRetrieval(hydrateRecordsFromCorpus(filteredSemantic, corpus), 'semantic'),
      trimmed,
    );

    const withMeta = (
      records: SearchRecord[],
      source: SearchQueryResult['source'],
    ): SearchQueryResult => ({
      records,
      source,
      meta: {
        provider: semanticMeta.provider,
        semanticCount: semanticMeta.count,
        topScore: semanticMeta.topScore,
        responseTimeMs: semanticMeta.responseTimeMs,
      },
    });

    // Empty Vectorize success must still surface keyword matches (projects/blog/pages).
    if (!hydrated.length) {
      return withMeta(localAll, 'local-fallback');
    }

    // Short keyword queries: prefer local title/tag hits; only keep semantic results
    // that share a query term or score highly (avoids noisy "fabric" → blog dumps).
    const termCount = trimmed.split(/\s+/).filter(Boolean).length;
    const isKeywordQuery = termCount <= 3;
    if (isKeywordQuery && localAll.length > 0) {
      const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
      const relevantSemantic = hydrated.filter((record) => {
        if (hasQueryTermOverlap(record, terms)) return true;
        // Extremely strong semantic only when the hit is not a bare hub page.
        return (record.score ?? 0) >= 0.85 && record.type !== 'page';
      });
      return withMeta(
        hydrateRecordsFromCorpus(
          filterNoisyHubRecords(mergeResults(localAll, relevantSemantic, limit), trimmed),
          corpus,
        ),
        'cloudflare-vectorize',
      );
    }

    if (category === 'all') {
      // Local keyword matches first so title hits aren't buried by weak semantic noise.
      return withMeta(
        hydrateRecordsFromCorpus(
          filterNoisyHubRecords(
            mergeResults(localAll, mergeResults(localPages, hydrated, limit), limit),
            trimmed,
          ),
          corpus,
        ),
        'cloudflare-vectorize',
      );
    }

    return withMeta(
      hydrateRecordsFromCorpus(
        filterNoisyHubRecords(mergeResults(localAll, hydrated, limit), trimmed),
        corpus,
      ),
      'cloudflare-vectorize',
    );
  } catch (error) {
    console.warn('[search] Cloudflare semantic search unavailable, using local fallback', error);
    return {
      records: localAll,
      source: 'local-fallback',
    };
  }
}
