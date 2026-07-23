/**
 * Shared AI search types and helpers (no service imports — avoids cycles).
 */

export type AIChatRole = 'user' | 'assistant' | 'system';

export type AIChatMessage = {
  role: AIChatRole;
  content: string;
};

export type AIChatSource = {
  title: string;
  url: string;
  snippet?: string;
  score?: number;
  collection?: string;
  publishedAt?: string;
  summary?: string;
  icon?: string;
};

/** Metadata from Cloudflare Worker response headers on /api/ai-search. */
export type AISearchMeta = {
  provider?: string;
  cacheStatus?: string;
  complexity?: string;
};

export type AIChatResponse = {
  message: string;
  sources: AIChatSource[];
  meta?: AISearchMeta;
};

export type SearchWithAIOptions = {
  signal?: AbortSignal;
  history?: AIChatMessage[];
  pageContext?: {
    url: string;
    title: string;
    pathname: string;
  } | null;
  onToken?: (token: string) => void;
  onCompletion?: (message: string) => void;
  onSources?: (sources: AIChatSource[]) => void;
  onMeta?: (meta: AISearchMeta) => void;
};

export class AISearchError extends Error {
  status?: number;
  retryAfterSec?: number;
  rateLimitReason?: string;
  constructor(
    message: string,
    status?: number,
    extras?: { retryAfterSec?: number; rateLimitReason?: string }
  ) {
    super(message);
    this.name = 'AISearchError';
    this.status = status;
    this.retryAfterSec = extras?.retryAfterSec;
    this.rateLimitReason = extras?.rateLimitReason;
  }
}

const SESSION_STORAGE_KEY = 'ai-chat:session-id';

export function getOrCreateAiSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = createAiSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
}

function createAiSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return `sess_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
  return `sess_${Date.now().toString(36)}`;
}

export function readAISearchMeta(response: Response): AISearchMeta {
  const provider = response.headers.get('x-ai-provider') ?? undefined;
  const cacheStatus = response.headers.get('x-cache-status') ?? undefined;
  const complexity = response.headers.get('x-query-complexity') ?? undefined;
  return {
    ...(provider ? { provider } : {}),
    ...(cacheStatus ? { cacheStatus } : {}),
    ...(complexity ? { complexity } : {}),
  };
}

/** Quiet user-facing label for Cloudflare AI provenance. */
export function formatAISearchProvenance(
  meta?: AISearchMeta | null,
  sourceCount = 0
): string | null {
  if (!meta?.provider && sourceCount <= 0) return null;
  const provider = meta?.provider ?? '';

  if (provider === 'workers-ai') {
    return null;
  }

  if (sourceCount > 0) {
    return null;
  }

  if (provider === 'autorag-cached' || meta?.cacheStatus === 'HIT') {
    return 'Cached answer';
  }
  if (provider === 'autorag') {
    return null;
  }
  return null;
}
