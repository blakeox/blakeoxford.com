import { afterEach, expect, it, vi } from 'vitest';
import { queryCloudflareSemanticSearch } from '../../src/lib/search/semanticSearch';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('allows the server retrieval budget plus response delivery before cancelling', async () => {
  vi.useFakeTimers();
  vi.spyOn(global, 'fetch').mockImplementation(
    (_url, options) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => resolve(Response.json({ provider: 'ai-search', results: [] })),
          8500
        );
        options?.signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true }
        );
      })
  );
  const pending = queryCloudflareSemanticSearch('fabric');
  await vi.advanceTimersByTimeAsync(8500);
  expect((await pending).meta.provider).toBe('ai-search');
});

it('bounds an unavailable request and still cancels obsolete queries immediately', async () => {
  vi.useFakeTimers();
  vi.spyOn(global, 'fetch').mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      })
  );
  const pending = queryCloudflareSemanticSearch('fabric');
  const check = expect(pending).rejects.toThrow('Aborted');
  await vi.advanceTimersByTimeAsync(12000);
  await check;
  const controller = new AbortController();
  const obsolete = queryCloudflareSemanticSearch('old query', 5, controller.signal);
  const cancelled = expect(obsolete).rejects.toThrow('Aborted');
  controller.abort();
  await cancelled;
});
