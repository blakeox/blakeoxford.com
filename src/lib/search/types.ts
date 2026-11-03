/**
 * Local Find / command-center search types (client-side index + optional Vectorize).
 * Edge AI chat (`/api/ai-search`) is `src/services/AISearchService.ts` + `src/lib/ai-search.ts`.
 */

export type SearchContentType = 'page' | 'project' | 'blog';

export type SearchCategory = 'all' | 'projects' | 'pages' | 'blog';

export type SearchRecord = {
  type: SearchContentType;
  title: string;
  description: string;
  href: string;
  tags: string[];
  featured?: boolean;
  score?: number;
  publishedAt?: string;
  image?: string;
  /** How this hit was retrieved — drives Find trust UI. */
  retrieval?: 'semantic' | 'hybrid' | 'keyword' | 'browse';
  excerpt?: string;
};

export type SemanticSearchMatch = {
  id: string;
  score: number;
  title: string;
  description: string;
  url: string;
  collection: string;
  tags: string[];
  date?: string;
  excerpt?: string;
};

export type SearchQueryOptions = {
  query: string;
  category: SearchCategory;
  limit?: number;
  signal?: AbortSignal;
  onLocalResults?: (records: SearchRecord[]) => void;
};

export type SearchQueryResult = {
  records: SearchRecord[];
  source: 'cloudflare-ai-search' | 'cloudflare-vectorize' | 'local-fallback' | 'browse';
  meta?: {
    degraded?: boolean;
    provider?: string;
    semanticCount?: number;
    topScore?: number;
    responseTimeMs?: number;
  };
};
