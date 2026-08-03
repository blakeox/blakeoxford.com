import type { Env } from '../types';
import { writeAiAnalytics } from '../shared/ai-analytics';

const CANARY_URL = 'https://blakeoxford.com/api/ai-search';
const CANARY_TIMEOUT_MS = 25_000;

type CanaryEnv = Pick<Env, 'AI_ANALYTICS'>;
type CanaryFetcher = typeof fetch;

export type AiSearchCanaryResult = {
  latencyMs: number;
  messageLength: number;
};

export async function runAiSearchCanary(
  env: CanaryEnv,
  scheduledTime: number,
  fetcher: CanaryFetcher = globalThis.fetch
): Promise<AiSearchCanaryResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CANARY_TIMEOUT_MS);
  const query = `Cloudflare AI Search canary ${new Date(scheduledTime).toISOString()}`;

  try {
    const response = await fetcher(CANARY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session-id': 'scheduled-canary' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      throw new Error(`AI Search canary returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { message?: unknown };
    const messageLength = typeof payload.message === 'string' ? payload.message.trim().length : 0;
    if (messageLength === 0) {
      throw new Error('AI Search canary returned no message');
    }

    writeAiAnalytics(env, {
      blobs: ['scheduled_canary', 'ok'],
      doubles: [latencyMs, messageLength],
      indexes: ['ai_search_canary'],
    });

    return { latencyMs, messageLength };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    writeAiAnalytics(env, {
      blobs: ['scheduled_canary', 'error'],
      doubles: [latencyMs, 0],
      indexes: ['ai_search_canary'],
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
