import { describe, expect, it } from 'vitest';
import { handleAiSearch } from '../../../functions/routes/ai-search';
import { handleSemanticSearch } from '../../../functions/routes/semantic-search';

function context(pathname: string, request: Request) {
  return {
    request,
    env: {},
    url: new URL(`https://blakeoxford.com${pathname}`),
    reqId: 'test-request-id',
  } as any;
}

describe('search input hardening', () => {
  it('rejects oversized AI search bodies', async () => {
    const request = {
      method: 'POST',
      headers: new Headers({ 'content-length': '32769' }),
    } as Request;

    const response = await handleAiSearch(context('/api/ai-search', request));

    expect(response?.status).toBe(413);
  });

  it('rejects oversized semantic-search queries', async () => {
    const request = new Request('https://blakeoxford.com/api/semantic-search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'x'.repeat(501) }),
    });

    const response = await handleSemanticSearch(context('/api/semantic-search', request));

    expect(response?.status).toBe(400);
  });
});
