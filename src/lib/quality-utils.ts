/**
 * Quality scoring and confidence indicator utilities
 */

import type { AIChatSource } from './ai-search';

/**
 * Calculate response quality score based on heuristics
 * @param content - Response content text
 * @param sources - Optional array of sources used
 * @returns Quality score from 0-100
 */
export function calculateResponseQuality(content: string, sources?: AIChatSource[]): number {
  if (!content || content.length < 10) return 0;

  let score = 0;

  // Source relevance (40 points)
  if (sources && sources.length > 0) {
    const avgRelevance = sources.reduce((sum, src) => sum + (src.score || 0), 0) / sources.length;
    score += avgRelevance * 0.4;
  }

  // Source count (20 points)
  const sourceCount = sources?.length || 0;
  if (sourceCount > 0) {
    score += Math.min(sourceCount / 5, 1) * 20;
  }

  // Response completeness (25 points)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 50) score += 25;
  else if (wordCount >= 25) score += 15;
  else if (wordCount >= 10) score += 10;

  // Source diversity (15 points)
  if (sources && sources.length > 0) {
    const uniqueCollections = new Set(sources.map((s) => s.collection)).size;
    score += Math.min(uniqueCollections / 3, 1) * 15;
  }

  return Math.round(Math.min(score, 100));
}

/**
 * Evaluate response quality using LLM
 * @param userQuery - Original user query
 * @param response - AI response to evaluate
 * @param sources - Sources used in response
 * @returns Quality breakdown or null if evaluation fails
 */
export async function evaluateResponseWithLLM(
  userQuery: string,
  response: string,
  sources: AIChatSource[]
): Promise<{
  overall: number;
  completeness: number;
  citationAccuracy: number;
  conciseness: number;
  relevance: number;
  reasoning: string;
} | null> {
  // Deliberately disabled: the previous implementation made a second client
  // request with an unsupported payload and duplicated user content into logs.
  // Keep the API as a compatibility shim for older callers while quality
  // scoring remains deterministic and local.
  void userQuery;
  void response;
  void sources;
  return null;
}

/**
 * Get confidence indicator based on quality score
 * @param score - Quality score (0-100)
 * @returns Confidence indicator with label, color, and emoji
 */
export function getConfidenceIndicator(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 80) {
    return {
      label: 'High confidence',
      color: 'text-success-emphasis',
      emoji: '✓',
    };
  }
  if (score >= 60) {
    return {
      label: 'Moderate confidence',
      color: 'text-warning-emphasis',
      emoji: '○',
    };
  }
  return {
    label: 'Low confidence',
    color: 'text-warning-emphasis',
    emoji: '!',
  };
}

/**
 * Get citation health indicator
 * @param health - Citation health status
 * @returns Indicator with color, icon, and label
 */
export function getCitationHealthIndicator(health: 'healthy' | 'warning' | 'error'): {
  color: string;
  icon: string;
  label: string;
  description: string;
} {
  switch (health) {
    case 'healthy':
      return {
        color: 'text-success-emphasis',
        icon: '✓',
        label: 'Healthy',
        description: 'All sources are relevant and properly cited',
      };
    case 'warning':
      return {
        color: 'text-warning-emphasis',
        icon: '⚠',
        label: 'Warning',
        description: 'Some sources may have lower relevance',
      };
    case 'error':
      return {
        color: 'text-error-emphasis',
        icon: '✗',
        label: 'Error',
        description: 'Sources are missing or have very low relevance',
      };
  }
}
