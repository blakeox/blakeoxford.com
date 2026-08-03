import { describe, expect, it, vi } from 'vitest';
import { runAiSearchCanary } from '../../functions/scheduled/ai-search-canary';

function analyticsEnv() {
  return {
    AI_ANALYTICS: {
      writeDataPoint: vi.fn(),
    },
  } as never;
}

describe('AI Search scheduled canary', () => {
  it('records a successful response without recording prompt or answer text', async () => {
    const env = analyticsEnv();
    const result = await runAiSearchCanary(
      env,
      Date.parse('2026-08-02T18:00:00.000Z'),
      vi.fn(async () => new Response(JSON.stringify({ message: 'canary answer' }), { status: 200 }))
    );

    expect(result.messageLength).toBe(13);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(env.AI_ANALYTICS.writeDataPoint).toHaveBeenCalledWith({
      blobs: ['scheduled_canary', 'ok'],
      doubles: expect.arrayContaining([13]),
      indexes: ['ai_search_canary'],
    });
  });

  it('fails closed when the provider returns an error', async () => {
    const env = analyticsEnv();
    await expect(
      runAiSearchCanary(
        env,
        Date.now(),
        vi.fn(async () => new Response('{}', { status: 503 }))
      )
    ).rejects.toThrow('HTTP 503');

    expect(env.AI_ANALYTICS.writeDataPoint).toHaveBeenCalledWith({
      blobs: ['scheduled_canary', 'error'],
      doubles: expect.any(Array),
      indexes: ['ai_search_canary'],
    });
  });

  it('fails when a successful provider response has no message', async () => {
    await expect(
      runAiSearchCanary(
        analyticsEnv(),
        Date.now(),
        vi.fn(async () => new Response(JSON.stringify({ sources: [] }), { status: 200 }))
      )
    ).rejects.toThrow('returned no message');
  });
});
