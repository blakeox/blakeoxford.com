import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleSemanticSearch } from '../../../functions/routes/semantic-search';
import {
  mapAiSearchChunks,
  retrieveSiteSearch,
  MANAGED_SEARCH_TIMEOUT_MS,
} from '../../../functions/routes/search-retrieval';

const chunk = (key: string, score = 0.9, title = 'Fabric') => ({
  id: key,
  score,
  text: '# Matched **workflow** passage',
  item: { key, metadata: { title, description: 'Public case study' } },
});
function request(
  env: Record<string, unknown>,
  body: string = '{"query":"workflow automation","limit":5}'
) {
  return handleSemanticSearch({
    request: new Request('https://blakeoxford.com/api/semantic-search', { method: 'POST', body }),
    url: new URL('https://blakeoxford.com/api/semantic-search'),
    env,
    reqId: 'managed-test',
  } as any);
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('managed site search', () => {
  it('retrieves hybrid reranked chunks, deduplicates destinations, and strips unsafe URLs', async () => {
    const search = vi.fn().mockResolvedValue({
      chunks: [
        chunk('https://blakeoxford.com/projects/fabric/', 0.8),
        chunk('https://blakeoxford.com/projects/fabric/?duplicate=1', 0.95),
        chunk('https://elsewhere.example/projects/fabric/'),
        chunk('javascript:alert(1)'),
        chunk('/api/private'),
        chunk('/assets/file.pdf'),
        chunk('/blog/automation/', 0.85, 'Automation'),
      ],
    });
    const response = await request({ AI_SEARCH: { search } });
    expect(response?.status).toBe(200);
    expect(search).toHaveBeenCalledWith({
      messages: [{ role: 'user', content: 'workflow automation' }],
      ai_search_options: {
        retrieval: { retrieval_type: 'hybrid', max_num_results: 15 },
        query_rewrite: { enabled: false },
        reranking: { enabled: true },
      },
    });
    const data = (await response!.json()) as any;
    expect(data.provider).toBe('ai-search');
    expect(data.results.map((r: any) => r.url)).toEqual(['/projects/fabric/', '/blog/automation/']);
    expect(data.results[0].score).toBe(0.95);
    expect(data.results[0].excerpt).toBe('Matched workflow passage');
  });
  it('keeps malformed markup and nested entities as plain text', () => {
    const value = {
      ...chunk('/projects/fabric/'),
      text: '<b>workflow</b> <<script>left> &quot;quote&quot; &amp;quot;literal',
    };
    const excerpt = mapAiSearchChunks({ chunks: [value] }, 5)[0].excerpt;
    expect(excerpt).toBe('workflow left "quote" &quot;literal');
    expect(excerpt).not.toMatch(/[<>]/);
  });
  it('accepts a genuine empty result without making a second provider request', async () => {
    const run = vi.fn();
    const response = await request({
      AI_SEARCH: { search: vi.fn().mockResolvedValue({ chunks: [] }) },
      AI: { run },
      VECTORIZE: {},
    });
    expect(((await response!.json()) as any).results).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });
  it('uses the existing Vectorize fallback when managed retrieval fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await request({
      AI_SEARCH: { search: vi.fn().mockRejectedValue(new Error('unavailable')) },
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] }) },
      VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [] }) },
    });
    expect(response?.headers.get('x-search-provider')).toBe('vectorize');
    expect(response?.status).toBe(200);
  });
  it('supports the keyword-only kill switch without contacting either AI provider', async () => {
    const search = vi.fn();
    const response = await request({ SEARCH_PROVIDER: 'local', AI_SEARCH: { search } });
    expect(response?.status).toBe(503);
    expect(search).not.toHaveBeenCalled();
  });
  it.each(['null', '[]', '{bad json'])('rejects malformed input %s', async (body) => {
    expect((await request({}, body))?.status).toBe(400);
  });
  it('keeps a healthy cold response beyond the former four-second cutoff', async () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const pending = request({
      AI_SEARCH: {
        search: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ chunks: [chunk('/projects/fabric/')] }), 5200)
          ),
      },
      AI: { run },
      VECTORIZE: {},
    });
    await vi.advanceTimersByTimeAsync(5200);
    const response = await pending;
    expect(response?.status).toBe(200);
    expect(response?.headers.get('x-search-provider')).toBe('ai-search');
    expect(run).not.toHaveBeenCalled();
  });
  it('classifies a managed timeout without logging query text or provider errors', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pending = request({ AI_SEARCH: { search: () => new Promise(() => {}) } });
    await vi.advanceTimersByTimeAsync(MANAGED_SEARCH_TIMEOUT_MS);
    const response = await pending;
    expect(response?.status).toBe(503);
    expect(response?.headers.get('x-search-provider')).toBe('unavailable');
    expect(warn).toHaveBeenCalledWith('[search] Managed retrieval unavailable; trying fallback', {
      reqId: 'managed-test',
      reason: 'timeout',
      elapsedMs: MANAGED_SEARCH_TIMEOUT_MS,
    });
  });
  it('bounds waiting for the managed provider', async () => {
    vi.useFakeTimers();
    const pending = retrieveSiteSearch({ search: () => new Promise(() => {}) } as any, 'fabric', 5);
    const check = expect(pending).rejects.toThrow('deadline');
    await vi.advanceTimersByTimeAsync(MANAGED_SEARCH_TIMEOUT_MS);
    await check;
  });
  it('rejects a malformed successful provider response', () => {
    expect(() => mapAiSearchChunks({ error: 'unexpected' }, 5)).toThrow();
  });
});
