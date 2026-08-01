/**
 * AI Feedback Service
 *
 * Client facade for Ask thumbs-up/down submissions (`POST /api/ai-feedback`).
 * Fire-and-forget: non-2xx and network errors are swallowed by callers.
 *
 * @module services/AIFeedbackService
 */

export type AIFeedbackSentiment = 'positive' | 'negative';

export type AIFeedbackPayload = {
  messageId: string;
  sentiment: AIFeedbackSentiment;
  query?: string | null;
  metadata?: Record<string, unknown>;
};

export type AIFeedbackConfig = {
  endpoint?: string;
};

const DEFAULT_ENDPOINT = '/api/ai-feedback';

/**
 * Submit Ask message feedback. Preserves keepalive so the request can finish
 * during navigation; does not throw on HTTP errors (matches prior hook behavior).
 */
export async function submitAIFeedback(
  payload: AIFeedbackPayload,
  config: AIFeedbackConfig = {}
): Promise<Response | null> {
  const endpoint = config.endpoint ?? DEFAULT_ENDPOINT;

  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messageId: payload.messageId,
        sentiment: payload.sentiment,
        query: payload.query,
        metadata: payload.metadata ?? {},
      }),
      keepalive: true,
    });
  } catch {
    return null;
  }
}
