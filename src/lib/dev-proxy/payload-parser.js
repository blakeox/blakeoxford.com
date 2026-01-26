/**
 * Payload parsing utilities for development proxy
 * Handles parsing and validation of request payloads
 */

/**
 * Extract query from payload (supports multiple field names)
 */
export function extractQuery(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  // Try different field names
  if (typeof payload.query === 'string') {
    return payload.query.trim();
  }
  if (typeof payload.prompt === 'string') {
    return payload.prompt.trim();
  }
  if (typeof payload.question === 'string') {
    return payload.question.trim();
  }

  return '';
}

/**
 * Parse and validate history array from payload
 */
export function parseHistory(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (!Array.isArray(payload.history)) {
    return [];
  }

  return payload.history
    .filter((entry) => {
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
export function parseQueryPayload(payload) {
  return {
    query: extractQuery(payload),
    history: parseHistory(payload),
  };
}

/**
 * Parse sources from upstream response data
 */
export function parseSources(data) {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const result = data.result && typeof data.result === 'object'
    ? data.result
    : data;

  if (!result || typeof result !== 'object') {
    return [];
  }

  if (!Array.isArray(result.data)) {
    return [];
  }

  return result.data
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const attributes = entry.attributes && typeof entry.attributes === 'object'
        ? entry.attributes
        : {};
      const fileMeta = attributes.file && typeof attributes.file === 'object'
        ? attributes.file
        : {};

      // Extract URL
      const rawUrl = typeof entry.filename === 'string' && entry.filename
        ? entry.filename
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
      let snippet;
      if (Array.isArray(entry.content)) {
        const contentItem = entry.content.find(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof item.text === 'string' &&
            item.text.trim()
        );
        if (contentItem && typeof contentItem.text === 'string') {
          snippet = contentItem.text.trim().slice(0, 320);
        }
      }

      // Extract score
      const score = typeof entry.score === 'number' ? entry.score : undefined;

      const source = {
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
    .filter((source) => source !== null);
}

/**
 * Extract message from upstream response
 */
export function extractMessage(data) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const result = data.result && typeof data.result === 'object'
    ? data.result
    : data;

  if (!result || typeof result !== 'object') {
    return '';
  }

  if (typeof result.response === 'string') {
    return result.response.trim();
  }

  if (typeof data.response === 'string') {
    return data.response.trim();
  }

  return '';
}

/**
 * Extract error detail from upstream error response
 */
export function extractErrorDetail(upstreamError) {
  if (typeof upstreamError?.error === 'string') {
    return upstreamError.error;
  }
  if (Array.isArray(upstreamError?.errors) && upstreamError.errors[0]?.message) {
    return upstreamError.errors[0].message;
  }
  return 'Upstream service error';
}

