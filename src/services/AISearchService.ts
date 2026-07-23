/**
 * AI Search Service — edge AI chat/search client (POST /api/ai-search).
 *
 * Local Find / command-center keyword + optional Vectorize search lives in
 * `src/lib/search/`. This service is the sole HTTP client for Ask / edge AI.
 *
 * @module services/AISearchService
 */

import { AppError, ErrorCodes, createApiErrorFromResponse } from '@/utils/errors';
import type { SearchFallback } from '@/lib/chat';
import {
  AISearchError,
  getOrCreateAiSessionId,
  readAISearchMeta,
  type AIChatResponse,
  type SearchWithAIOptions,
} from '@/lib/ai-search-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AISearchRequest {
  query: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  useMemory?: boolean;
  sessionId?: string;
}

export interface AISearchResponse {
  answer: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string;
    score?: number;
    type?: string;
  }>;
  fallbackResults?: SearchFallback[];
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    tokensUsed?: number;
  };
}

export interface AISearchStreamCallbacks {
  onChunk: (chunk: string) => void;
  onSources?: (sources: AISearchResponse['sources']) => void;
  onComplete?: (response: AISearchResponse) => void;
  onError?: (error: AppError) => void;
}

export interface AISearchConfig {
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  enableStreaming?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<AISearchConfig> = {
  endpoint: '/api/ai-search',
  timeout: 45000,
  maxRetries: 3,
  enableStreaming: true,
};

const REQUEST_TIMEOUT_MS = 45000;

function withTimeout(signal?: AbortSignal, ms = REQUEST_TIMEOUT_MS): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    const timeoutSignal = AbortSignal.timeout(ms);
    if (!signal) return timeoutSignal;
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal.addEventListener('abort', onAbort, { once: true });
    timeoutSignal.addEventListener('abort', onAbort, { once: true });
    return controller.signal;
  }
  return signal ?? new AbortController().signal;
}

function normalizeSources(raw: unknown): AIChatResponse['sources'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;
      const title = typeof e.title === 'string' ? e.title : '';
      const url = typeof e.url === 'string' ? e.url : '';
      if (!title || !url) return null;
      return {
        title,
        url,
        snippet: typeof e.snippet === 'string' ? e.snippet : undefined,
        score: typeof e.score === 'number' ? e.score : undefined,
        collection: typeof e.collection === 'string' ? e.collection : undefined,
        publishedAt: typeof e.publishedAt === 'string' ? e.publishedAt : undefined,
        summary: typeof e.summary === 'string' ? e.summary : undefined,
        icon: typeof e.icon === 'string' ? e.icon : undefined,
      };
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
}

async function consumeEventStream(
  response: Response,
  options: {
    onToken?: (token: string) => void;
    onCompletion?: (message: string) => void;
    onSources?: (sources: AIChatResponse['sources']) => void;
  }
): Promise<AIChatResponse> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new AISearchError('AI search stream has no body', response.status);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let assembledMessage = '';
  let collectedSources: AIChatResponse['sources'] = [];

  const processEvent = (raw: string) => {
    const lines = raw.split(/\r?\n/);
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    const dataRaw = dataLines.join('\n');
    if (!dataRaw) {
      if (eventName === 'ready') return;
      return;
    }
    let parsed: unknown = dataRaw;
    try {
      parsed = JSON.parse(dataRaw);
    } catch {
      /* keep string */
    }

    if (eventName === 'token') {
      const text =
        typeof parsed === 'object' &&
        parsed &&
        typeof (parsed as { text?: unknown }).text === 'string'
          ? (parsed as { text: string }).text
          : typeof parsed === 'string'
            ? parsed
            : '';
      if (text) {
        assembledMessage += text;
        options.onToken?.(text);
      }
      return;
    }
    if (eventName === 'sources') {
      collectedSources = normalizeSources(parsed);
      options.onSources?.(collectedSources);
      return;
    }
    if (eventName === 'done') {
      if (
        typeof parsed === 'object' &&
        parsed &&
        typeof (parsed as { message?: unknown }).message === 'string'
      ) {
        assembledMessage = (parsed as { message: string }).message;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
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

// ─── Service Class ────────────────────────────────────────────────────────────

/**
 * Service for interacting with the AI search API at /api/ai-search.
 */
export class AISearchService {
  private config: Required<AISearchConfig>;
  private abortController: AbortController | null = null;

  constructor(config: AISearchConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Canonical Ask companion search (streaming when onToken is provided).
   */
  async search(prompt: string, options?: SearchWithAIOptions): Promise<AIChatResponse> {
    if (!prompt?.trim()) {
      throw new AISearchError('Prompt is required');
    }

    this.abort();
    this.abortController = new AbortController();

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

    const outerSignal = preferStream ? options?.signal : withTimeout(options?.signal);
    const signal = this.abortController.signal;
    if (outerSignal) {
      if (outerSignal.aborted) this.abortController.abort();
      else
        outerSignal.addEventListener('abort', () => this.abortController?.abort(), { once: true });
    }

    const sessionId = getOrCreateAiSessionId();

    const response = await fetch(this.config.endpoint, {
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
        const errorData = (await response.json()) as { error?: unknown; resetIn?: unknown };
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
        if (typeof errorData.resetIn === 'number' && Number.isFinite(errorData.resetIn)) {
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

    const data = (await response.json()) as { message?: unknown; sources?: unknown };
    const message = typeof data.message === 'string' ? data.message : '';
    const sources = normalizeSources(data.sources);

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

  /**
   * Send a query and get a streamed response (class-style callbacks API).
   */
  async queryStream(request: AISearchRequest, callbacks: AISearchStreamCallbacks): Promise<void> {
    try {
      const result = await this.search(request.query, {
        history: request.history,
        onToken: callbacks.onChunk,
        onSources: (sources) => callbacks.onSources?.(sources),
      });
      callbacks.onComplete?.({
        answer: result.message,
        sources: result.sources,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const appError =
        error instanceof AISearchError
          ? AppError.from(error, ErrorCodes.AI_INFERENCE_ERROR)
          : AppError.from(error, ErrorCodes.AI_INFERENCE_ERROR);
      callbacks.onError?.(appError);
      throw appError;
    }
  }

  /**
   * Send a query and get a complete response (non-streaming)
   */
  async query(request: AISearchRequest): Promise<AISearchResponse> {
    try {
      const result = await this.search(request.query, {
        history: request.history,
      });
      return {
        answer: result.message,
        sources: result.sources,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AppError('Request cancelled', ErrorCodes.CHAT_TIMEOUT);
      }
      if (error instanceof AISearchError && error.status) {
        throw await createApiErrorFromResponse(
          new Response(JSON.stringify({ error: error.message }), { status: error.status })
        ).catch(() => AppError.from(error, ErrorCodes.AI_INFERENCE_ERROR));
      }
      throw AppError.from(error, ErrorCodes.AI_INFERENCE_ERROR);
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/_healthz', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok || response.status === 204;
    } catch {
      return false;
    }
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

let instance: AISearchService | null = null;

export function getAISearchService(config?: AISearchConfig): AISearchService {
  if (!instance || config) {
    instance = new AISearchService(config);
  }
  return instance;
}

export function resetAISearchService(): void {
  instance?.abort();
  instance = null;
}
