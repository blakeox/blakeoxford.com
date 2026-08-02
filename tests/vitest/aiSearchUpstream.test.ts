import { describe, expect, it } from 'vitest';
import { parseAiSources } from '../../functions/routes/ai-search/parse-sources';
import {
  buildAiSearchRequest,
  extractAiSearchError,
  extractAiSearchMessage,
  extractAiSearchSourceData,
} from '../../functions/routes/ai-search/upstream';

describe('Cloudflare AI Search upstream adapter', () => {
  it('builds the new chat-completions request from bounded conversation history', () => {
    expect(
      buildAiSearchRequest('current question', [
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier answer' },
      ])
    ).toEqual({
      messages: [
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier answer' },
        { role: 'user', content: 'current question' },
      ],
    });
  });

  it('extracts the new chat response and chunks', () => {
    const payload = {
      choices: [{ message: { role: 'assistant', content: '  New answer  ' } }],
      chunks: [
        {
          id: 'chunk-1',
          text: 'source text',
          score: 0.9,
          item: { key: '/projects/example', metadata: { title: 'Example project' } },
        },
      ],
    };

    expect(extractAiSearchMessage(payload)).toBe('New answer');
    expect(extractAiSearchSourceData(payload)).toEqual(payload.chunks);
    expect(parseAiSources(payload.chunks)).toEqual([
      {
        title: 'Example project',
        url: '/projects/example',
        snippet: 'source text',
        score: 0.9,
        collection: 'Project',
        icon: '🛠️',
      },
    ]);
  });

  it('keeps legacy AutoRAG responses readable during rollback', () => {
    const payload = {
      result: {
        response: 'Legacy answer',
        data: [{ filename: '/projects/example', score: 0.8 }],
      },
    };

    expect(extractAiSearchMessage(payload)).toBe('Legacy answer');
    expect(extractAiSearchSourceData(payload)).toEqual(payload.result.data);
  });

  it('extracts provider errors without exposing unrelated response fields', () => {
    expect(extractAiSearchError({ errors: [{ message: 'permission denied' }] })).toBe(
      'permission denied'
    );
    expect(extractAiSearchError({ error: 'bad request', token: 'redacted' })).toBe('bad request');
    expect(extractAiSearchError({ errors: [{ code: 1000 }] })).toBeUndefined();
  });
});
