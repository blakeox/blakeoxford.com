import { describe, expect, it } from 'vitest';
import {
  createIndexingJob,
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
              { name: 'ai:response:v5:answer' },
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

    expect(deleted).toBe(3);
    const deleteCall = calls.find((call) => call.url.endsWith('/bulk/delete'));
    expect(deleteCall?.method).toBe('POST');
    expect(JSON.parse(deleteCall?.body || '[]')).toEqual([
      'ai:response:v4:hirepath',
      'ai:response:v5:answer',
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
        getJob: async () => ({
          id: 'job',
          ended_at: '2026-09-30 01:09:50',
          end_reason: 'crawl error',
        }),
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

describe('createIndexingJob', () => {
  it('returns a newly created job without delay', async () => {
    const job = { id: 'new-job' };
    const delays: number[] = [];
    expect(
      await createIndexingJob({
        createJob: () => job,
        sleep: async (ms: number) => {
          delays.push(ms);
        },
      })
    ).toBe(job);
    expect(delays).toEqual([]);
  });

  it('waits for the documented cooldown before retrying creation', async () => {
    const order: Array<string | number> = [];
    const job = { id: 'fresh-job' };
    let attempts = 0;
    const result = await createIndexingJob({
      createJob: () => {
        order.push('create');
        if (++attempts === 1) throw new Error('sync_in_cooldown [code: 7020]');
        return job;
      },
      sleep: async (ms: number) => {
        order.push(ms);
      },
    });
    expect(result).toBe(job);
    expect(order).toEqual(['create', 30000, 'create']);
  });

  it('fails after three attempts without an unbounded retry loop', async () => {
    const error = new Error('sync_in_cooldown [code: 7020]');
    let attempts = 0;
    const delays: number[] = [];
    await expect(
      createIndexingJob({
        createJob: () => {
          attempts++;
          throw error;
        },
        sleep: async (ms: number) => {
          delays.push(ms);
        },
      })
    ).rejects.toBe(error);
    expect(attempts).toBe(3);
    expect(delays).toEqual([30000, 30000]);
  });

  it.each([
    'Authentication error [code: 10000]',
    'Internal authentication error [code: 10500]',
    'Unexpected response',
  ])('fails immediately for %s', async (message) => {
    const error = new Error(message);
    let attempts = 0;
    const delays: number[] = [];
    await expect(
      createIndexingJob({
        createJob: () => {
          attempts++;
          throw error;
        },
        sleep: async (ms: number) => {
          delays.push(ms);
        },
      })
    ).rejects.toBe(error);
    expect(attempts).toBe(1);
    expect(delays).toEqual([]);
  });
});
