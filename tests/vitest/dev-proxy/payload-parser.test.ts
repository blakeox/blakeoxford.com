/**
 * Unit tests for dev-proxy payload parser
 */

import { describe, it, expect } from 'vitest';
import {
  extractQuery,
  parseHistory,
  parseQueryPayload,
  parseSources,
  extractMessage,
  extractErrorDetail,
} from '../../../src/lib/dev-proxy/payload-parser.js';

describe('payload-parser', () => {
  describe('extractQuery', () => {
    it('should extract query from query field', () => {
      const payload = { query: 'test query' };
      expect(extractQuery(payload)).toBe('test query');
    });

    it('should extract query from prompt field', () => {
      const payload = { prompt: 'test prompt' };
      expect(extractQuery(payload)).toBe('test prompt');
    });

    it('should extract query from question field', () => {
      const payload = { question: 'test question' };
      expect(extractQuery(payload)).toBe('test question');
    });

    it('should prioritize query over prompt and question', () => {
      const payload = {
        query: 'query value',
        prompt: 'prompt value',
        question: 'question value',
      };
      expect(extractQuery(payload)).toBe('query value');
    });

    it('should trim whitespace', () => {
      const payload = { query: '  test query  ' };
      expect(extractQuery(payload)).toBe('test query');
    });

    it('should return empty string for invalid payload', () => {
      expect(extractQuery(null)).toBe('');
      expect(extractQuery(undefined)).toBe('');
      expect(extractQuery({})).toBe('');
      expect(extractQuery('invalid')).toBe('');
    });
  });

  describe('parseHistory', () => {
    it('should parse valid history array', () => {
      const payload = {
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
      };
      const result = parseHistory(payload);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(result[1]).toEqual({ role: 'assistant', content: 'Hi there' });
    });

    it('should filter invalid entries', () => {
      const payload = {
        history: [
          { role: 'user', content: 'Valid' },
          { role: 'invalid' }, // Missing content
          { content: 'Missing role' }, // Missing role
          null,
          'invalid string',
          { role: 'user', content: 'Another valid' },
        ],
      };
      const result = parseHistory(payload);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'user', content: 'Valid' });
      expect(result[1]).toEqual({ role: 'user', content: 'Another valid' });
    });

    it('should limit to last 10 entries', () => {
      const payload = {
        history: Array.from({ length: 15 }, (_, i) => ({
          role: 'user',
          content: `Message ${i}`,
        })),
      };
      const result = parseHistory(payload);
      expect(result).toHaveLength(10);
      expect(result[0].content).toBe('Message 5'); // Last 10 entries
      expect(result[9].content).toBe('Message 14');
    });

    it('should return empty array for invalid payload', () => {
      expect(parseHistory(null)).toEqual([]);
      expect(parseHistory(undefined)).toEqual([]);
      expect(parseHistory({})).toEqual([]);
      expect(parseHistory({ history: 'invalid' })).toEqual([]);
    });
  });

  describe('parseQueryPayload', () => {
    it('should parse complete payload', () => {
      const payload = {
        query: 'test query',
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
        ],
      };
      const result = parseQueryPayload(payload);
      expect(result.query).toBe('test query');
      expect(result.history).toHaveLength(2);
    });

    it('should handle payload with only query', () => {
      const payload = { query: 'test' };
      const result = parseQueryPayload(payload);
      expect(result.query).toBe('test');
      expect(result.history).toEqual([]);
    });

    it('should handle payload with only history', () => {
      const payload = {
        history: [{ role: 'user', content: 'Test' }],
      };
      const result = parseQueryPayload(payload);
      expect(result.query).toBe('');
      expect(result.history).toHaveLength(1);
    });
  });

  describe('extractMessage', () => {
    it('should extract message from result.response', () => {
      const data = {
        result: {
          response: 'Test message',
        },
      };
      expect(extractMessage(data)).toBe('Test message');
    });

    it('should extract message from data.response', () => {
      const data = {
        response: 'Direct message',
      };
      expect(extractMessage(data)).toBe('Direct message');
    });

    it('should prioritize result.response over data.response', () => {
      const data = {
        result: {
          response: 'Result message',
        },
        response: 'Direct message',
      };
      expect(extractMessage(data)).toBe('Result message');
    });

    it('should trim whitespace', () => {
      const data = {
        result: {
          response: '  Trimmed message  ',
        },
      };
      expect(extractMessage(data)).toBe('Trimmed message');
    });

    it('should return empty string for invalid data', () => {
      expect(extractMessage(null)).toBe('');
      expect(extractMessage(undefined)).toBe('');
      expect(extractMessage({})).toBe('');
    });
  });

  describe('extractErrorDetail', () => {
    it('should extract error from error field', () => {
      const error = { error: 'Error message' };
      expect(extractErrorDetail(error)).toBe('Error message');
    });

    it('should extract error from errors array', () => {
      const error = {
        errors: [{ message: 'First error' }, { message: 'Second error' }],
      };
      expect(extractErrorDetail(error)).toBe('First error');
    });

    it('should return default message when no error found', () => {
      expect(extractErrorDetail({})).toBe('Upstream service error');
      expect(extractErrorDetail(null)).toBe('Upstream service error');
      expect(extractErrorDetail(undefined)).toBe('Upstream service error');
    });
  });

  describe('parseSources', () => {
    it('should parse sources from result.data', () => {
      const data = {
        result: {
          data: [
            {
              filename: '/path/to/file',
              attributes: {
                file: { title: 'File Title' },
              },
              content: [{ text: 'Snippet text here' }],
              score: 0.95,
            },
          ],
        },
      };
      const result = parseSources(data);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: 'File Title',
        url: '/path/to/file',
        snippet: 'Snippet text here',
        score: 0.95,
      });
    });

    it('should parse sources from data.data', () => {
      const data = {
        data: [
          {
            filename: '/path/to/file',
            attributes: {
              folder: 'Folder Name',
            },
          },
        ],
      };
      const result = parseSources(data);
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('/path/to/file');
      expect(result[0].title).toBe('Folder Name');
    });

    it('should use folder as title when file title not available', () => {
      const data = {
        result: {
          data: [
            {
              attributes: {
                folder: '/folder/path',
              },
            },
          ],
        },
      };
      const result = parseSources(data);
      expect(result[0].title).toBe('/folder/path');
      expect(result[0].url).toBe('/folder/path');
    });

    it('should generate default title for sources without title', () => {
      const data = {
        result: {
          data: [
            { filename: '/path1' },
            { filename: '/path2' },
          ],
        },
      };
      const result = parseSources(data);
      expect(result[0].title).toBe('Source 1');
      expect(result[1].title).toBe('Source 2');
    });

    it('should filter out invalid entries', () => {
      const data = {
        result: {
          data: [
            { filename: '/valid' },
            null,
            {},
            { attributes: {} }, // No filename or folder
          ],
        },
      };
      const result = parseSources(data);
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('/valid');
    });

    it('should truncate snippet to 320 characters', () => {
      const longSnippet = 'a'.repeat(400);
      const data = {
        result: {
          data: [
            {
              filename: '/path',
              content: [{ text: longSnippet }],
            },
          ],
        },
      };
      const result = parseSources(data);
      expect(result[0].snippet).toHaveLength(320);
    });

    it('should return empty array for invalid data', () => {
      expect(parseSources(null)).toEqual([]);
      expect(parseSources(undefined)).toEqual([]);
      expect(parseSources({})).toEqual([]);
      expect(parseSources({ result: {} })).toEqual([]);
    });
  });
});

