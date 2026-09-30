import { describe, expect, it } from 'vitest';
import {
  purgeAiResponseCache,
  waitForIndexingJob,
} from '../../scripts/deploy/refresh-ai-search.mjs';

describe('purgeAiResponseCache', () => {
  it('deletes only paginated answer keys', async () => {
    const calls: Array<{ url: string; method: string; body?: string }> = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, method: init?.method || 'GET', body: init?.body?.toString() });
      if (url.includes('/keys') && !url.includes('cursor=')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            result: [
              { name: 'ai:response:v4:hirepath' },
              { name: 'conversation:backup:should-stay' },
            ],
            result_info: { cursor: 'next' },
          }),
        } as Response;
      }
      if (url.includes('cursor=next')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            result: [{ name: 'ai:response:v4:fabric' }],
            result_info: { cursor: '' },
          }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    };

    const deleted = await purgeAiResponseCache({
      token: 'test-token',
      fetchImpl,
    });

    expect(deleted).toBe(2);
    const deleteCall = calls.find((call) => call.url.endsWith('/bulk/delete'));
    expect(deleteCall?.method).toBe('POST');
    expect(JSON.parse(deleteCall?.body || '[]')).toEqual([
      'ai:response:v4:hirepath',
      'ai:response:v4:fabric',
    ]);
    expect(calls.some((call) => call.url.includes('conversation:backup'))).toBe(false);
  });
});

describe('waitForIndexingJob', () => {
  it('returns after the job finishes', async () => {
    const jobs = [{ id: 'job' }, { id: 'job', ended_at: '2026-09-30 01:09:50', end_reason: null }];
    const result = await waitForIndexingJob({
      getJob: async () => jobs.shift(),
      sleep: async () => {},
      now: (() => {
        let time = 0;
        return () => time++;
      })(),
    });
    expect(result.ended_at).toBe('2026-09-30 01:09:50');
  });

  it('stops when the job fails', async () => {
    await expect(
      waitForIndexingJob({
        getJob: async () => ({ id: 'job', ended_at: '2026-09-30 01:09:50', end_reason: 'crawl error' }),
        sleep: async () => {},
        now: () => 0,
      })
    ).rejects.toThrow('crawl error');
  });

  it('stops when the job does not finish in time', async () => {
    let time = 0;
    await expect(
      waitForIndexingJob({
        getJob: async () => ({ id: 'job' }),
        timeoutMs: 1000,
        sleep: async () => {},
        now: () => {
          const current = time;
          time += 1001;
          return current;
        },
      })
    ).rejects.toThrow('timed out');
  });
});
