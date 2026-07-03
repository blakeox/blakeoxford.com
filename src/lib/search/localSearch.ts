import type { SearchCategory, SearchRecord } from './types';
import { filterByCategory } from './searchIndexLoader';

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function searchLocalCorpus(
  corpus: SearchRecord[],
  query: string,
  category: SearchCategory,
  limit = 10,
): SearchRecord[] {
  const pool = filterByCategory(corpus, category);

  if (!normalize(query)) {
    return pool
      .slice()
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .slice(0, limit);
  }

  const terms = normalize(query).split(/\s+/).filter(Boolean);

  return pool
    .map((record) => {
      const haystack = `${record.title} ${record.description} ${record.tags.join(' ')}`.toLowerCase();
      const matchedTerms = terms.filter((term) => haystack.includes(term)).length;
      const score = matchedTerms / terms.length;
      return { record, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record, score }) => ({ ...record, score }));
}
