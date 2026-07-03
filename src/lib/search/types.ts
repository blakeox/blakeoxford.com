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
};

export type SearchQueryOptions = {
  query: string;
  category: SearchCategory;
  limit?: number;
  signal?: AbortSignal;
};

export type SearchQueryResult = {
  records: SearchRecord[];
  source: 'cloudflare-vectorize' | 'local-fallback' | 'browse';
};
