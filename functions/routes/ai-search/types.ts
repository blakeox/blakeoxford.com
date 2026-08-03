export type AiSearchPayload = {
  query?: unknown;
  prompt?: unknown;
  question?: unknown;
  history?: unknown;
  stream?: unknown;
  pageContext?: {
    title?: unknown;
    pathname?: unknown;
    url?: unknown;
  } | null;
};

export type PageContext = { title: string; pathname: string; url: string } | null;

export type HistoryEntry = { role: 'user' | 'assistant'; content: string };

export type RateLimitBucket = { count: number; reset: number };

export type RateLimitResult =
  { limited: false } | { limited: true; reason: string; resetIn: number };

export type CachedAiResponse = {
  message?: string;
  sources?: unknown[];
  timestamp?: number;
};

export type AiSourcePayload = {
  title: string;
  url: string;
  snippet?: string;
  score?: number;
  collection?: string;
  icon?: string;
  publishedAt?: string;
  summary?: string;
};

export function isRateLimitBucket(value: unknown): value is RateLimitBucket {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as RateLimitBucket).count === 'number' &&
    typeof (value as RateLimitBucket).reset === 'number'
  );
}

export function isCachedAiResponse(value: unknown): value is CachedAiResponse {
  return !!value && typeof value === 'object';
}

export function parsePageContext(raw: AiSearchPayload['pageContext']): PageContext {
  if (!raw || typeof raw !== 'object') return null;
  return {
    title: typeof raw.title === 'string' ? raw.title.trim() : '',
    pathname: typeof raw.pathname === 'string' ? raw.pathname.trim() : '',
    url: typeof raw.url === 'string' ? raw.url.trim() : '',
  };
}

export function extractQuery(payload: AiSearchPayload): string {
  if (typeof payload.query === 'string') return payload.query.trim();
  if (typeof payload.prompt === 'string') return payload.prompt.trim();
  if (typeof payload.question === 'string') return payload.question.trim();
  return '';
}

export function parseHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is HistoryEntry =>
        !!entry &&
        typeof entry === 'object' &&
        ((entry as HistoryEntry).role === 'user' || (entry as HistoryEntry).role === 'assistant') &&
        typeof (entry as HistoryEntry).content === 'string'
    )
    .slice(-10);
}
