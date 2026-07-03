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

  // Nav pages are not in Vectorize — always supplement with local page matches.
  const localPages = searchLocalCorpus(corpus, trimmed, 'pages', 5);

  if (category === 'pages') {
    return {
      records: searchLocalCorpus(corpus, trimmed, 'pages', limit),
      source: 'local-fallback',
    };
  }

  try {
    const semanticResults = await queryCloudflareSemanticSearch(trimmed, limit, signal);
    const filteredSemantic = filterByCategory(semanticResults, category === 'all' ? 'all' : category);

    if (category === 'all') {
      return {
        records: mergeResults(filteredSemantic, localPages, limit),
        source: 'cloudflare-vectorize',
      };
    }

    return {
      records: filteredSemantic.slice(0, limit),
      source: 'cloudflare-vectorize',
    };
  } catch (error) {
    console.warn('[search] Cloudflare semantic search unavailable, using local fallback', error);
    return {
      records: searchLocalCorpus(corpus, trimmed, category, limit),
      source: 'local-fallback',
    };
  }
}
