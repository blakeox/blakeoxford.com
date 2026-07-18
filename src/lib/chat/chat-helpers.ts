/**
 * Helper functions for AI Chat Island component
 */

import type { AIChatSource } from '../ai-search';
import { MAX_SUMMARY_LENGTH, SUMMARY_TRUNCATE_AT } from './chat-constants';
import { decodeHtmlEntities, decodeMimeEncodedWords } from '../string-utils';

/**
 * Clean and truncate snippet text for display
 */
export function cleanSnippet(snippet: string): string {
  const prepared = decodeMimeEncodedWords(snippet);
  const withoutLinks = prepared
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  const withoutMarkdown = withoutLinks
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^---.*$/gm, ' ')
    .replace(/^[#>*+-]\s*/gm, ' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1');
  const decoded = decodeHtmlEntities(withoutMarkdown)
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/Press Esc to close\.?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!decoded) return '';
  return decoded.length > MAX_SUMMARY_LENGTH
    ? `${decoded.slice(0, SUMMARY_TRUNCATE_AT).trim()}…`
    : decoded;
}

/**
 * Check citation health based on source quality metrics
 */
export async function checkCitationHealth(
  sources?: AIChatSource[]
): Promise<'healthy' | 'warning' | 'error'> {
  if (!sources || sources.length === 0) return 'warning';

  let errorCount = 0;
  let warningCount = 0;

  for (const source of sources) {
    const isValidUrl = (() => {
      try {
        new URL(
          source.url,
          typeof window !== 'undefined' ? window.location.origin : 'https://blakeoxford.com'
        );
        return true;
      } catch {
        return false;
      }
    })();

    const hasGoodScore = source.score !== undefined && source.score >= 0.5;
    const hasMetadata = Boolean(source.title && source.url);

    if (!isValidUrl || !hasMetadata) {
      errorCount++;
    } else if (!hasGoodScore) {
      warningCount++;
    }
  }

  const totalSources = sources.length;
  const errorRate = errorCount / totalSources;
  const warningRate = warningCount / totalSources;

  if (errorRate > 0.3) return 'error';
  if (errorRate > 0 || warningRate > 0.5) return 'warning';
  return 'healthy';
}

/**
 * Soft framing for Ask — keep short conversational questions intact.
 * Heavy "comprehensive analysis" appends hurt AutoRAG retrieval.
 */
export function enhanceQuery(query: string, hasHistory: boolean): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  if (hasHistory || trimmed.length < 72) {
    return trimmed;
  }

  const analyticalPatterns =
    /\b(analyze|compare|contrast|synthesize|evaluate|assess|implications?|impact|why|how does|what makes|difference between)\b/i;
  if (analyticalPatterns.test(trimmed)) {
    return trimmed;
  }

  const queryLower = trimmed.toLowerCase();

  if (queryLower.match(/\b(skill|experience|tech|stack|tool|framework|language|proficiency)\b/)) {
    return `${trimmed} Include concrete project examples when relevant.`;
  }

  if (queryLower.match(/\b(project|case study|work|portfolio|built|created|developed)\b/)) {
    return `${trimmed} Focus on outcomes and approaches used.`;
  }

  return trimmed;
}
