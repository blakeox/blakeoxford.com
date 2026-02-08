/**
 * Payload parsing utilities for development proxy
 * Handles parsing and validation of request payloads
 */

export interface ParsedQueryPayload {
  query: string;
  history: Array<{ role: string; content: string }>;
}

export interface ParsedSource {
  title: string;
  url: string;
  snippet?: string;
  score?: number;
}

/**
 * Extract query from payload (supports multiple field names)
 */
export function extractQuery(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const p = payload as Record<string, unknown>;
  
  // Try different field names
  if (typeof p.query === 'string') {
    return p.query.trim();
  }
  if (typeof p.prompt === 'string') {
    return p.prompt.trim();
  }
  if (typeof p.question === 'string') {
    return p.question.trim();
  }

  return '';
}

/**
 * Parse and validate history array from payload
 */
export function parseHistory(payload: unknown): Array<{ role: string; content: string }> {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const p = payload as Record<string, unknown>;
  
  if (!Array.isArray(p.history)) {
    return [];
  }

  return p.history
    .filter((entry): entry is { role: string; content: string } => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.role === 'string' &&
        typeof entry.content === 'string'
      );
    })
    .slice(-10); // Keep only last 10 entries
}

/**
 * Parse query payload from request body
 */
export function parseQueryPayload(payload: unknown): ParsedQueryPayload {
  return {
    query: extractQuery(payload),
    history: parseHistory(payload),
  };
}

/**
 * Parse sources from upstream response data
 */
export function parseSources(data: unknown): ParsedSource[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const result = (data as { result?: unknown }).result && typeof (data as { result: unknown }).result === 'object'
    ? (data as { result: unknown }).result
    : data;

  if (!result || typeof result !== 'object') {
    return [];
  }

  const resultObj = result as { data?: unknown };
  
  if (!Array.isArray(resultObj.data)) {
    return [];
  }

  return resultObj.data
    .map((entry, index): ParsedSource | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const entryObj = entry as Record<string, unknown>;
      const attributes = entryObj.attributes && typeof entryObj.attributes === 'object'
        ? (entryObj.attributes as Record<string, unknown>)
        : {};
      const fileMeta = attributes.file && typeof attributes.file === 'object'
        ? (attributes.file as Record<string, unknown>)
        : {};

      // Extract URL
      const rawUrl = typeof entryObj.filename === 'string' && entryObj.filename
        ? entryObj.filename
        : typeof attributes.folder === 'string'
          ? attributes.folder
          : '';

      if (!rawUrl) {
        return null;
      }

      // Extract title
      const titleCandidate = typeof fileMeta.title === 'string' && fileMeta.title.trim()
        ? fileMeta.title.trim()
        : typeof attributes.folder === 'string' && attributes.folder.trim()
          ? attributes.folder.trim()
          : `Source ${index + 1}`;

      // Extract snippet
      let snippet: string | undefined;
      if (Array.isArray(entryObj.content)) {
        const contentItem = entryObj.content.find(
          (item): item is { text: string } =>
            item &&
            typeof item === 'object' &&
            typeof (item as { text?: unknown }).text === 'string' &&
            Boolean((item as { text: string }).text.trim())
        );
        if (contentItem && typeof contentItem.text === 'string') {
          snippet = contentItem.text.trim().slice(0, 320);
        }
      }

      // Extract score
      const score = typeof entryObj.score === 'number' ? entryObj.score : undefined;

      const source: ParsedSource = {
        title: titleCandidate,
        url: rawUrl,
      };

      if (snippet) {
        source.snippet = snippet;
      }

      if (typeof score === 'number') {
        source.score = score;
      }

      return source;
    })
    .filter((source): source is ParsedSource => source !== null);
}

/**
 * Extract message from upstream response
 */
export function extractMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const result = (data as { result?: unknown }).result && typeof (data as { result: unknown }).result === 'object'
    ? (data as { result: unknown }).result
    : data;

  if (!result || typeof result !== 'object') {
    return '';
  }

  const resultObj = result as { response?: unknown };
  const dataObj = data as { response?: unknown };

  if (typeof resultObj.response === 'string') {
    return resultObj.response.trim();
  }

  if (typeof dataObj.response === 'string') {
    return dataObj.response.trim();
  }

  return '';
}

/**
 * Extract a human-friendly error detail from upstream error payloads
 */
export function extractErrorDetail(err: unknown): string {
  const defaultMsg = 'Upstream service error';
  if (!err || typeof err !== 'object') return defaultMsg;

  const e = err as Record<string, unknown>;

  if (typeof e.error === 'string' && e.error.trim()) {
    return e.error.trim();
  }

  if (Array.isArray(e.errors) && e.errors.length > 0) {
    const first = e.errors[0];
    if (first && typeof first === 'object' && typeof (first as any).message === 'string') {
      return (first as any).message.trim();
    }
  }

  if (typeof e.message === 'string' && e.message.trim()) {
    return e.message.trim();
  }

  return defaultMsg;
}

