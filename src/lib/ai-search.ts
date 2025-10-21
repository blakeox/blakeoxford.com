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

export type AIChatResponse = {
  message: string;
  sources: AIChatSource[];
};

export type SearchWithAIOptions = {
  signal?: AbortSignal;
  history?: AIChatMessage[];
  onToken?: (token: string) => void;
  onCompletion?: (message: string) => void;
  onSources?: (sources: AIChatSource[]) => void;
};

export class AISearchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AISearchError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 45000;

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
    const lines = rawEvent.split(/\r?\n/);
    let eventType = 'message';
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5));
      }
    }
    const payloadRaw = dataLines.join('\n').trim();
    let payload: unknown = payloadRaw;
    if (payloadRaw) {
      if (payloadRaw.startsWith('{') || payloadRaw.startsWith('[')) {
        try {
          payload = JSON.parse(payloadRaw);
        } catch {
          payload = payloadRaw;
        }
      }
    }
    if (eventType === 'token') {
      const token = typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && typeof (payload as { text?: unknown }).text === 'string'
          ? (payload as { text: string }).text
          : '';
      if (token) {
        assembledMessage += token;
        options.onToken?.(token);
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
  };

  const signal = preferStream ? options?.signal : withTimeout(options?.signal);

  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(preferStream ? { accept: 'text/event-stream' } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to reach AI search service';
    try {
      const errorData = await response.json();
      if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch {
      // ignore JSON parse issues
    }
    throw new AISearchError(errorMessage, response.status);
  }

  const contentType = response.headers.get('content-type') || '';
  if (preferStream && contentType.includes('text/event-stream')) {
    return consumeEventStream(response, {
      onToken: options?.onToken,
      onCompletion: options?.onCompletion,
      onSources: options?.onSources,
    });
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

  return { message, sources };
}
