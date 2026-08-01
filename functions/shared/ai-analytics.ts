import type { Env } from '../types';

export type AiAnalyticsEvent = {
  blobs: Array<string | null>;
  doubles: Array<number | null>;
  indexes: Array<string | null>;
};

/**
 * Best-effort Analytics Engine write for Ask / Find edge paths.
 * Never throws — observability must not break request handling.
 */
export function writeAiAnalytics(env: Pick<Env, 'AI_ANALYTICS'>, event: AiAnalyticsEvent): void {
  if (!env.AI_ANALYTICS) return;
  try {
    env.AI_ANALYTICS.writeDataPoint(event);
  } catch {
    // Analytics is non-critical
  }
}
