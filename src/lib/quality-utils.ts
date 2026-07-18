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
  try {
    const evaluationPrompt = `You are an AI quality evaluator. Evaluate this response on a scale of 0-100 for each criterion:

User Query: "${userQuery}"

Response: "${response.substring(0, 1000)}"

Sources Used: ${sources.length} sources from ${new Set(sources.map((s) => s.collection)).size} collections

Evaluate on these criteria:
1. **Completeness** (0-100): Does it fully answer the question?
2. **Citation Accuracy** (0-100): Are sources relevant and properly used?
3. **Conciseness** (0-100): Is it clear and to-the-point?
4. **Relevance** (0-100): Does it address the user's actual need?

Respond ONLY with valid JSON:
{
 "completeness": 85,
 "citation_accuracy": 90,
 "conciseness": 75,
 "relevance": 95,
 "reasoning": "Brief explanation of scores"
}`;

    const evaluationResponse = await fetch('/api/ai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: evaluationPrompt,
        useRAG: false, // Direct LLM call
      }),
    });

    if (!evaluationResponse.ok) {
      throw new Error('Evaluation API call failed');
    }

    const data = await evaluationResponse.json();
    const evaluationText = data.response || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in evaluation response');
    }

    const scores = JSON.parse(jsonMatch[0]);

    // Calculate weighted overall score
    const overall = Math.round(
      scores.completeness * 0.3 +
        scores.citation_accuracy * 0.3 +
        scores.conciseness * 0.2 +
        scores.relevance * 0.2
    );

    return {
      overall,
      completeness: scores.completeness,
      citationAccuracy: scores.citation_accuracy,
      conciseness: scores.conciseness,
      relevance: scores.relevance,
      reasoning: scores.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    console.error('LLM evaluation failed:', error);
    return null;
  }
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
