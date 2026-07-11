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
  constructor(message: string, status?: number, extras?: { retryAfterSec?: number; rateLimitReason?: string }) {
    super(message);
    this.name = 'AISearchError';
    this.status = status;
    this.retryAfterSec = extras?.retryAfterSec;
    this.rateLimitReason = extras?.rateLimitReason;
  }
}

const REQUEST_TIMEOUT_MS = 45000;
const SESSION_STORAGE_KEY = 'ai-chat:session-id';

export function getOrCreateAiSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const created =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
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
  sourceCount = 0,
): string | null {
  if (!meta?.provider && sourceCount <= 0) return null;
  const provider = meta?.provider ?? '';
  if (provider === 'autorag-cached' || meta?.cacheStatus === 'HIT') {
    return sourceCount > 0 ? 'Cached · cited from site index' : 'Cached answer';
  }
  if (provider === 'workers-ai') {
    return sourceCount > 0
      ? 'Quick answer · Workers AI'
      : 'Quick answer · not cited from site index';
  }
  if (provider === 'autorag' || sourceCount > 0) {
    return sourceCount > 0 ? 'Cited from site index · AutoRAG' : 'Answered with AutoRAG';
  }
  return null;
}

function withTimeout(signal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    const abortHandler = () => controller.abort();
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortHandler, { once: true });
      controller.signal.addEventListener('abort', () => signal.removeEventListener('abort', abortHandler), { once: true });
    }
  }

  controller.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });

  return controller.signal;
}

function normalizeSources(value: unknown): AIChatSource[] {
  if (!Array.isArray(value)) return [];
  const sources: AIChatSource[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as { title?: unknown; url?: unknown; snippet?: unknown; score?: unknown; collection?: unknown; publishedAt?: unknown; summary?: unknown; icon?: unknown };
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Referenced source';
    const url = typeof raw.url === 'string' ? raw.url : '';
    if (!url) continue;
    const snippet = typeof raw.snippet === 'string' ? raw.snippet : undefined;
    const score = typeof raw.score === 'number' ? raw.score : undefined;
    const collection = typeof raw.collection === 'string' && raw.collection.trim() ? raw.collection.trim() : undefined;
    const publishedAt = typeof raw.publishedAt === 'string' && raw.publishedAt.trim() ? raw.publishedAt.trim() : undefined;
    const summary = typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim() : undefined;
    const icon = typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : undefined;
    const source: AIChatSource = { title, url };
    if (snippet) source.snippet = snippet;
    if (typeof score === 'number') source.score = score;
    if (collection) source.collection = collection;
    if (publishedAt) source.publishedAt = publishedAt;
    if (summary) source.summary = summary;
    if (icon) source.icon = icon;
    sources.push(source);
  }
  return sources;
}

async function consumeEventStream(response: Response, options: Pick<SearchWithAIOptions, 'onToken' | 'onCompletion' | 'onSources'>): Promise<AIChatResponse> {
  if (!response.body) {
    throw new AISearchError('Streamed response missing body', response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let assembledMessage = '';
  let collectedSources: AIChatSource[] = [];

  const processEvent = (rawEvent: string) => {
    if (!rawEvent.trim()) return;

    // Collect lines and prefer 'data:' lines per SSE spec
    const lines = rawEvent.split(/\r?\n/);
    let eventType = 'message';
    const dataLines: string[] = [];
    for (const line of lines) {
      if (/^event:\s*/i.test(line)) {
        // event: may be malformed or followed by extra text; capture the declared type
        try {
          eventType = line.slice(line.indexOf(':') + 1).trim() || eventType;
        } catch {
          // ignore
        }
      } else if (/^data:\s*/i.test(line)) {
        dataLines.push(line.slice(line.indexOf(':') + 1));
      } else {
        // Some producers may emit JSON fragments without the 'data:' prefix.
        // Accept other lines as part of the payload if they look like JSON.
        dataLines.push(line);
      }
    }

    const payloadRaw = dataLines.join('\n').trim();

    // Try to recover a JSON payload if present. Some sources may concatenate
    // fragments or emit stray metadata (e.g. "event: tok{...}"). Find the first
    // JSON bracket and attempt to parse from there. If parsing fails, fall back
    // to using the raw string token.
    let payload: unknown = payloadRaw;
    try {
      const firstJsonIdx = Math.min(
        ...['{', '[']
          .map((ch) => payloadRaw.indexOf(ch))
          .filter((i) => i >= 0)
      );
      if (!Number.isNaN(firstJsonIdx) && firstJsonIdx > 0) {
        const candidate = payloadRaw.slice(firstJsonIdx).trim();
        try {
          payload = JSON.parse(candidate);
        } catch {
          // Try a more permissive cleanup: remove stray "event:" tokens and
          // any leading non-json characters, then attempt parse.
          const cleaned = payloadRaw.replace(/event:\s*[^\r\n]+/gi, '').replace(/^[^{[]*/s, '').trim();
          if (cleaned && (cleaned.startsWith('{') || cleaned.startsWith('['))) {
            try {
              payload = JSON.parse(cleaned);
            } catch (err2) {
              // keep as raw string below
               
              console.debug('AI stream: failed to parse cleaned JSON fragment', { candidate, cleaned, err: String(err2) });
            }
          }
        }
      } else if (payloadRaw.startsWith('{') || payloadRaw.startsWith('[')) {
        try {
          payload = JSON.parse(payloadRaw);
        } catch (err3) {
          // ignore and fall back to raw string
           
          console.debug('AI stream: failed to parse JSON payload', { payloadRaw, err: String(err3) });
        }
      }
    } catch {
      // Best-effort: leave payload as raw string
    }

    if (eventType === 'token') {
      const token = typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && typeof (payload as { text?: unknown }).text === 'string'
          ? (payload as { text: string }).text
          : payloadRaw;
      if (token) {
        assembledMessage += String(token);
        options.onToken?.(String(token));
      }
    } else if (eventType === 'sources') {
      const nextSources = normalizeSources(payload);
      if (nextSources.length > 0) {
        collectedSources = nextSources;
        options.onSources?.(nextSources);
      }
    } else if (eventType === 'done') {
      if (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string') {
        const doneMessage = (payload as { message: string }).message;
        if (doneMessage && !assembledMessage) {
          assembledMessage = doneMessage;
          options.onToken?.(doneMessage);
        }
      } else if (typeof payload === 'string' && payload.trim()) {
        // fallback: treat final string as completion
        assembledMessage = String(payload);
        options.onToken?.(assembledMessage);
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      processEvent(chunk);
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    processEvent(buffer);
  }

  options.onCompletion?.(assembledMessage);
  if (!assembledMessage) {
    throw new AISearchError('AI search stream ended without message', response.status);
  }

  return { message: assembledMessage, sources: collectedSources };
}

export async function searchWithAI(prompt: string, options?: SearchWithAIOptions): Promise<AIChatResponse> {
  if (!prompt?.trim()) {
    throw new AISearchError('Prompt is required');
  }

  const preferStream = Boolean(options?.onToken) && typeof ReadableStream !== 'undefined';
  const payload = {
    query: prompt.trim(),
    history: options?.history ?? [],
    stream: preferStream,
    ...(options?.pageContext
      ? {
          pageContext: {
            url: options.pageContext.url,
            title: options.pageContext.title,
            pathname: options.pageContext.pathname,
          },
        }
      : {}),
  };

  const signal = preferStream ? options?.signal : withTimeout(options?.signal);
  const sessionId = getOrCreateAiSessionId();

  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-session-id': sessionId,
      ...(preferStream ? { accept: 'text/event-stream' } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to reach AI search service';
    let resetIn: number | undefined;
    try {
      const errorData = await response.json();
      if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      }
      if (typeof errorData?.resetIn === 'number' && Number.isFinite(errorData.resetIn)) {
        resetIn = errorData.resetIn;
      }
    } catch {
      // ignore JSON parse issues
    }
    const retryHeader = response.headers.get('retry-after');
    const retryAfterSec =
      resetIn ??
      (retryHeader && Number.isFinite(Number(retryHeader)) ? Number(retryHeader) : undefined);
    const rateLimitReason = response.headers.get('x-rate-limit-reason') ?? undefined;
    throw new AISearchError(errorMessage, response.status, { retryAfterSec, rateLimitReason });
  }

  const contentType = response.headers.get('content-type') || '';
  const meta = readAISearchMeta(response);
  if (Object.keys(meta).length > 0) {
    options?.onMeta?.(meta);
  }

  if (preferStream && contentType.includes('text/event-stream')) {
    const streamed = await consumeEventStream(response, {
      onToken: options?.onToken,
      onCompletion: options?.onCompletion,
      onSources: options?.onSources,
    });
    return { ...streamed, meta: Object.keys(meta).length ? meta : undefined };
  }

  const data = await response.json();
  const message = typeof data?.message === 'string' ? data.message : '';
  const sources = normalizeSources(data?.sources);

  if (!message) {
    throw new AISearchError('AI search response did not include a message');
  }

  if (message && options?.onToken) {
    options.onToken(message);
  }
  if (options?.onCompletion) {
    options.onCompletion(message);
  }
  if (sources.length > 0 && options?.onSources) {
    options.onSources(sources);
  }

  return {
    message,
    sources,
    meta: Object.keys(meta).length ? meta : undefined,
  };
}
