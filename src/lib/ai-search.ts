/**
 * AI search types + helpers for Ask / edge AI.
 *
 * HTTP/streaming lives in `src/services/AISearchService.ts`.
 * Local Find index lives in `src/lib/search/`.
 */

export {
  AISearchError,
  formatAISearchProvenance,
  getOrCreateAiSessionId,
  readAISearchMeta,
  type AIChatMessage,
  type AIChatResponse,
  type AIChatRole,
  type AIChatSource,
  type AISearchMeta,
  type SearchWithAIOptions,
} from './ai-search-types';

import type { AIChatResponse, SearchWithAIOptions } from './ai-search-types';
import { getAISearchService } from '@/services/AISearchService';

/** Thin facade over AISearchService (canonical HTTP client). */
export async function searchWithAI(
  prompt: string,
  options?: SearchWithAIOptions
): Promise<AIChatResponse> {
  return getAISearchService().search(prompt, options);
}
