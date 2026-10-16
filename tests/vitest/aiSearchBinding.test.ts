import { describe, expect, it, vi } from 'vitest';
import { handleAiSearch } from '../../functions/routes/ai-search';
import { handleSimpleQueryWithWorkersAI } from '../../functions/routes/ai-search/workers-ai';

function searchContext(request: Request, env: Record<string, unknown>) {
  return {
    request,
    env,
    url: new URL('https://blakeoxford.com/api/ai-search'),
    reqId: 'test-request-id',
  } as never;
}

describe('AI Search instance binding', () => {
  it('also removes leading question echoes from the conversational Workers AI path', async () => {
    const query = 'What does he do well?';
    const response = await handleAiSearch(
      searchContext(
        new Request('https://blakeoxford.com/api/ai-search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query }),
        }),
        {
          RATE_LIMIT_KV: { get: async () => null, put: async () => undefined },
          AI: {
            run: async () => ({
              response: `${query} ${query} He automates operational workflows.`,
            }),
          },
        }
      )
    );
    expect(response?.status).toBe(200);
    expect((await response!.json()).message).toBe('He automates operational workflows.');
  });

  it('does not reuse answers from the previous cache generation', async () => {
    const query = 'What outcomes did the Microsoft Fabric project achieve?';
    const response = await handleAiSearch(
      searchContext(
        new Request('https://blakeoxford.com/api/ai-search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query }),
        }),
        {
          RATE_LIMIT_KV: { get: async () => null, put: async () => undefined },
          AI_RESPONSE_CACHE: {
            get: async (key: string) =>
              key.startsWith('ai:response:v4:')
                ? { message: `${query} Stale echoed answer.`, sources: [], timestamp: Date.now() }
                : null,
            put: async () => undefined,
          },
          AI_SEARCH: {
            chatCompletions: async () => ({
              choices: [{ message: { content: 'Fresh answer.' } }],
              chunks: [],
            }),
          },
        }
      )
    );
    expect(response?.status).toBe(200);
    expect((await response!.json()).message).toBe('Fresh answer.');
  });

  it('rejects a question-only response instead of returning an empty answer', async () => {
    const query = 'What outcomes did the Microsoft Fabric project achieve?';
    const response = await handleAiSearch(
      searchContext(
        new Request('https://blakeoxford.com/api/ai-search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query }),
        }),
        {
          RATE_LIMIT_KV: { get: async () => null, put: async () => undefined },
          AI_SEARCH: {
            chatCompletions: async () => ({
              choices: [{ message: { content: `${query} ${query}` } }],
              chunks: [],
            }),
          },
        }
      )
    );
    expect(response?.status).toBe(502);
    expect((await response!.json()).error).toBe('AI service returned no message');
  });

  it.each([false, true])(
    'removes question echoes before returning a stream=%s answer',
    async (stream) => {
      const query = 'What outcomes did the Microsoft Fabric project achieve?';
      const answer = 'It enabled 200 teammates.';
      const response = await handleAiSearch(
        searchContext(
          new Request('https://blakeoxford.com/api/ai-search', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ query, stream }),
          }),
          {
            RATE_LIMIT_KV: { get: async () => null, put: async () => undefined },
            AI_SEARCH: {
              chatCompletions: async () => ({
                choices: [{ message: { content: `${query} ${query} ${answer}` } }],
                chunks: [
                  {
                    text: 'Fabric case study',
                    item: { key: '/projects/microsoft-fabric/', metadata: { title: 'Fabric' } },
                  },
                ],
              }),
            },
          }
        )
      );
      expect(response?.status).toBe(200);
      const body = await response!.text();
      expect(body).not.toContain(query);
      expect(body).toContain(answer);
      expect(body).toContain('/projects/microsoft-fabric/');
    }
  );

  it('returns JSON from the binding without calling the REST endpoint', async () => {
    const chatCompletions = vi.fn(async () => ({
      choices: [{ message: { content: 'Bound answer' } }],
      chunks: [],
    }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await handleAiSearch(
      searchContext(
        new Request('https://blakeoxford.com/api/ai-search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: 'How does the HirePath project differ from the Fabric migration?',
          }),
        }),
        {
          RATE_LIMIT_KV: { get: async () => null, put: async () => undefined },
          AI_SEARCH: { chatCompletions },
        }
      )
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get('x-ai-provider')).toBe('autorag');
    await expect(response?.json()).resolves.toEqual({
      message: 'Bound answer',
      sources: [],
    });
    expect(chatCompletions).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('keeps the public SSE contract for a binding response', async () => {
    const response = await handleAiSearch(
      searchContext(
        new Request('https://blakeoxford.com/api/ai-search', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'text/event-stream',
          },
          body: JSON.stringify({
            query: 'How does the HirePath project differ from the Fabric migration?',
          }),
        }),
        {
          RATE_LIMIT_KV: { get: async () => null, put: async () => undefined },
          AI_SEARCH: {
            chatCompletions: async () => ({
              choices: [{ message: { content: 'Bound answer' } }],
              chunks: [],
            }),
          },
        }
      )
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get('content-type')).toContain('text/event-stream');
    const body = await response?.text();
    expect(body).toContain('event: ready');
    expect(body).toContain('event: token');
    expect(body).toContain('event: done');
    expect(body).toContain('Bound answer');
  });
});

describe('Workers AI busy rejection', () => {
  it('asks the runtime to reject when capacity is busy and still returns null', async () => {
    const run = vi.fn(async () => ({ response: '' }));
    const result = await handleSimpleQueryWithWorkersAI('What does he do well?', [], {
      AI: { run },
      AI_GATEWAY_ID: 'default',
    } as never);

    expect(result).toBeNull();
    expect(run).toHaveBeenCalledWith(
      '@cf/meta/llama-3.1-8b-instruct-fast',
      expect.objectContaining({ max_tokens: 420 }),
      expect.objectContaining({
        rejectIfBusy: true,
        gateway: expect.objectContaining({ id: 'default', skipCache: true }),
      })
    );
  });
});
