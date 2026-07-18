/**
 * Response quality evaluation and finalization utilities
 */

import type { ChatMessage } from './chat-types';
import { autoragEvents } from '../analytics';
import { checkCitationHealth } from './chat-helpers';
import { calculateResponseQuality, evaluateResponseWithLLM } from '../quality-utils';

/**
 * Finalize assistant message with quality scoring and citation health
 * @param messageId - ID of the message to finalize
 * @param content - Final content of the message
 * @param messages - Current messages array
 * @param userQuery - The user query that prompted this response
 * @returns Updated message with quality scores
 */
export async function finalizeMessageQuality(
  messageId: string,
  content: string,
  messages: ChatMessage[],
  userQuery: string
): Promise<Partial<ChatMessage> | null> {
  const message = messages.find((m) => m.id === messageId);
  if (!message) return null;

  // Calculate response time
  const responseTime = message.timestamp ? Date.now() - message.timestamp : 0;

  // Calculate baseline heuristic score immediately
  const heuristicScore = calculateResponseQuality(content, message.sources);
  const citationHealth = await checkCitationHealth(message.sources);

  // Start with baseline scores
  const baseUpdate: Partial<ChatMessage> = {
    content,
    responseTime,
    qualityScore: heuristicScore,
    citationHealth,
  };

  // Try LLM evaluation asynchronously
  try {
    const llmEvaluation = await evaluateResponseWithLLM(userQuery, content, message.sources || []);

    if (llmEvaluation) {
      // Track quality metric with detailed breakdown
      autoragEvents.qualityScore({
        overall_score: llmEvaluation.overall,
        completeness: llmEvaluation.completeness,
        citation_accuracy: llmEvaluation.citationAccuracy,
        conciseness: llmEvaluation.conciseness,
        relevance: llmEvaluation.relevance,
        source_count: message.sources?.length || 0,
        word_count: content.trim().split(/\s+/).length,
        citation_health: citationHealth,
        response_time_ms: responseTime,
      });

      return {
        ...baseUpdate,
        qualityScore: llmEvaluation.overall,
        qualityDetails: {
          completeness: llmEvaluation.completeness,
          citationAccuracy: llmEvaluation.citationAccuracy,
          conciseness: llmEvaluation.conciseness,
          relevance: llmEvaluation.relevance,
          reasoning: llmEvaluation.reasoning,
        },
      };
    }
  } catch (error) {
    console.error('LLM evaluation failed, using heuristic score:', error);
    // Return the heuristic score
  }

  return baseUpdate;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: attempt to focus a hidden textarea and rely on legacy execCommand when available.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    type LegacyExecCommand = (commandId: 'copy') => boolean;
    const execCommand = (document as Document & { execCommand?: LegacyExecCommand }).execCommand;
    const success = execCommand?.('copy') ?? false;

    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Get relevance explanation based on score (0-100 scale)
 */
export function getRelevanceExplanation(score: number): {
  text: string;
  color: string;
  icon: string;
} {
  if (score >= 90) {
    return {
      text: 'Highly relevant - Core information matching your query',
      color: 'text-success-emphasis',
      icon: '🎯',
    };
  }
  if (score >= 75) {
    return {
      text: 'Very relevant - Strong match to your question',
      color: 'text-info-emphasis',
      icon: '✨',
    };
  }
  if (score >= 60) {
    return {
      text: 'Relevant - Contains related information',
      color: 'text-accent-emphasis',
      icon: '💡',
    };
  }
  return {
    text: 'Contextually relevant - Provides background context',
    color: 'text-warning-emphasis',
    icon: '📌',
  };
}
