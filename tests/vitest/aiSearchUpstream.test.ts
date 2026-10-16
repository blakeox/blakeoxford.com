import { describe, expect, it } from 'vitest';
import { parseAiSources } from '../../functions/routes/ai-search/parse-sources';
import {
  buildAiSearchRequest,
  extractAiSearchError,
  extractAiSearchMessage,
  extractAiSearchSourceData,
} from '../../functions/routes/ai-search/upstream';

describe('Cloudflare AI Search upstream adapter', () => {
  it('preserves an answer beginning with a non-question search phrase', () => {
    const answer = 'Blake Oxford is an enterprise systems specialist.';
    expect(extractAiSearchMessage({ response: answer }, 'Blake Oxford')).toBe(answer);
  });

  it('removes mixed original and rewritten question echoes', () => {
    expect(
      extractAiSearchMessage(
        {
          response: 'What projects has Blake Oxford built? What projects has he built? Automation.',
        },
        'What projects has he built?',
        'What projects has Blake Oxford built?'
      )
    ).toBe('Automation.');
  });

  it('does not feed echoed answers or duplicate in-flight questions back into history', () => {
    const request = buildAiSearchRequest('Current question?', [
      { role: 'user', content: 'Earlier question?' },
      { role: 'assistant', content: 'Earlier question? Earlier question? Earlier answer.' },
      { role: 'user', content: 'Current question?' },
      { role: 'assistant', content: '' },
    ]);
    expect(request.messages.slice(1)).toEqual([
      { role: 'user', content: 'Earlier question?' },
      { role: 'assistant', content: 'Earlier answer.' },
      { role: 'user', content: 'Current question?' },
    ]);
  });

  it('treats question punctuation as literal text when removing echoes', () => {
    const query = 'What are C++ [x] costs ($)?';
    expect(extractAiSearchMessage({ response: `${query} Actual answer.` }, query)).toBe(
      'Actual answer.'
    );
  });

  it('removes repeated leading copies of the submitted question from the answer', () => {
    const question = 'What outcomes did the Microsoft Fabric project achieve?';
    const answer = 'It enabled 200 teammates across 10 departments.';
    expect(
      extractAiSearchMessage(
        { choices: [{ message: { content: `${question}\n${question} ${answer}` } }] },
        question
      )
    ).toBe(answer);
  });

  it('preserves a question quoted within a substantive answer', () => {
    const question = 'What changed?';
    const answer = `The project automated reporting. The team asked “${question}” during reviews.`;
    expect(extractAiSearchMessage({ response: answer }, question)).toBe(answer);
  });

  it('does not accept a response containing only the question as an answer', () => {
    expect(
      extractAiSearchMessage({ response: 'What changed? What changed?' }, 'What changed?')
    ).toBe('');
  });

  it('builds the new chat-completions request from bounded conversation history', () => {
    expect(
      buildAiSearchRequest('current question', [
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier answer' },
      ])
    ).toEqual({
      messages: [
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('Do not repeat'),
        }),
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
