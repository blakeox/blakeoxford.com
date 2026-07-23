/**
 * Chat fallback semantic search facade.
 *
 * Isolates Vectorize `/api/semantic-search` fetch + Ask-specific ranking
 * (score ≥ 0.62, top 3) so chat hooks never raw-fetch.
 */

import type { SearchFallback } from './chat-types';
import { SEMANTIC_SEARCH_URL } from './chat-constants';

type SemanticHit = {
  title?: string;
  id: string;
  url?: string;
  description?: string;
  score?: number;
};

const SCORE_FLOOR = 0.62;
const CANDIDATE_LIMIT = 6;
const RESULT_LIMIT = 3;

/**
 * Ranked page suggestions when Ask cannot answer from AutoRAG / Workers AI.
 * Returns [] on empty query, non-OK responses, or network errors.
 */
export async function getChatFallbackSuggestions(query: string): Promise<SearchFallback[]> {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  try {
    const response = await fetch(SEMANTIC_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: normalized }),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { results?: SemanticHit[] };
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .slice(0, CANDIDATE_LIMIT)
      .map((result) => ({
        title: result.title || result.id,
        url: result.url || `/${result.id}`,
        excerpt: result.description || '',
        score: result.score || 0,
      }))
      .filter((result) => result.score >= SCORE_FLOOR)
      .slice(0, RESULT_LIMIT);
  } catch (err) {
    console.error('Semantic search failed:', err);
    return [];
  }
}
