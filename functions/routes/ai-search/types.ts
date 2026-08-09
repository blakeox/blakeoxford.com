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

const MAX_HISTORY_ENTRIES = 10;
const MAX_HISTORY_ENTRY_LENGTH = 2000;
const MAX_HISTORY_TOTAL_LENGTH = 12000;
const MAX_PAGE_CONTEXT_LENGTH = 240;

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
    title: typeof raw.title === 'string' ? raw.title.trim().slice(0, MAX_PAGE_CONTEXT_LENGTH) : '',
    pathname:
      typeof raw.pathname === 'string' ? raw.pathname.trim().slice(0, MAX_PAGE_CONTEXT_LENGTH) : '',
    url: typeof raw.url === 'string' ? raw.url.trim().slice(0, MAX_PAGE_CONTEXT_LENGTH) : '',
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
  const entries = raw
    .filter(
      (entry): entry is HistoryEntry =>
        !!entry &&
        typeof entry === 'object' &&
        ((entry as HistoryEntry).role === 'user' || (entry as HistoryEntry).role === 'assistant') &&
        typeof (entry as HistoryEntry).content === 'string'
    )
    .slice(-MAX_HISTORY_ENTRIES)
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim().slice(0, MAX_HISTORY_ENTRY_LENGTH),
    }));

  let totalLength = 0;
  return entries.filter((entry) => {
    totalLength += entry.content.length;
    return totalLength <= MAX_HISTORY_TOTAL_LENGTH;
  });
}
