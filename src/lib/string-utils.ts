/**
 * String utility functions for text processing and decoding
 */

/**
 * Decode HTML entities in a string
 * @param value - String containing HTML entities
 * @returns Decoded string
 */
export function decodeHtmlEntities(value: string): string {
  if (typeof document === 'undefined') return value;

  const txt = document.createElement('textarea');
  txt.innerHTML = value;
  return txt.value;
}

/**
 * Decode MIME encoded words (RFC 2047) in email headers
 * @param value - String potentially containing MIME encoded words
 * @returns Decoded string
 */
export function decodeMimeEncodedWords(value: string): string {
  if (!value) return value;

  return value.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, _charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'Q') {
        text = text
          .replace(/_/g, ' ')
          .replace(/=([0-9A-F]{2})/gi, (_m: string, hex: string) =>
            String.fromCharCode(parseInt(hex, 16))
          );
      } else if (encoding.toUpperCase() === 'B') {
        text = atob(text);
      }
      return text;
    } catch {
      return match;
    }
  });
}

/**
 * Clean and format a snippet for display
 * @param snippet - Raw snippet text
 * @returns Cleaned and formatted snippet
 */
export function cleanSnippet(snippet: string): string {
  if (!snippet) return '';

  return snippet
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^["']|["']$/g, '')
    .trim();
}

function stripFencedCodeBlocks(value: string): string {
  const fence = '```';
  let cursor = 0;
  let result = '';

  while (cursor < value.length) {
    const openingStart = value.indexOf(fence, cursor);
    if (openingStart === -1) return result + value.slice(cursor);

    result += value.slice(cursor, openingStart);
    const contentStart = openingStart + fence.length;
    const closingStart = value.indexOf(fence, contentStart);
    if (closingStart === -1) return result + value.slice(openingStart);

    const languageLineEnd = value.indexOf('\n', contentStart);
    const bodyStart =
      languageLineEnd !== -1 && languageLineEnd < closingStart ? languageLineEnd + 1 : contentStart;
    result += value.slice(bodyStart, closingStart);
    cursor = closingStart + fence.length;
  }

  return result;
}

/**
 * Clean assistant response text for plain-text chat bubbles.
 * Models often emit markdown (**bold**, headers) that looks broken when not rendered.
 */
export function cleanAssistantResponse(content: string): string {
  let cleaned = content.trim();

  const leadIns = [
    /^(Here is |Here's |I found |I can help |Let me help |Based on |According to |I'll |I will )/i,
    /^(Sure[,!]? |Certainly[,!]? |Of course[,!]? |Absolutely[,!]? )/i,
  ];

  for (const pattern of leadIns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Fenced code blocks → inner text
  cleaned = stripFencedCodeBlocks(cleaned);

  // Headings: "## Title" → "Title"
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Bold / strong / underline — unwrap markers, keep the words
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');

  // Italic *word* (avoid list markers like "* item")
  cleaned = cleaned.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/gm, '$1$2');
  cleaned = cleaned.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/gm, '$1$2');

  // Inline code + markdown links
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // Any leftover emphasis markers from partial matches
  cleaned = cleaned.replace(/\*\*/g, '');

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n /g, '\n');

  return cleaned.trim();
}

/**
 * Format a published date string
 * @param value - Date string or ISO timestamp
 * @returns Formatted date string or null
 */
export function formatPublishedDate(value?: string): string | null {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

/** Compact relative date for Find result rows (blog posts). */
export function formatRelativeDate(value?: string): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const deltaMs = Date.now() - date.getTime();
    const days = Math.round(deltaMs / 86_400_000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) {
      const months = Math.max(1, Math.round(days / 30));
      return `${months}mo ago`;
    }
    const years = Math.max(1, Math.round(days / 365));
    return `${years}y ago`;
  } catch {
    return null;
  }
}

/**
 * Generate a unique ID
 * @returns Random ID string
 */
export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
