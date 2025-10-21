/**
 * String Utility Tests
 * Comprehensive tests for string manipulation functions
 */
import { describe, it, expect } from 'vitest';
import {
  truncate,
  truncateWords,
  normalizeTrailingSlash,
  slugify,
  capitalize,
} from '../../../src/utils/index';

describe('String Utilities', () => {
  describe('truncate', () => {
    it('truncates text longer than max length', () => {
      const result = truncate('This is a very long text', 10);
      expect(result).toBe('This is...');
      expect(result.length).toBe(10);
    });

    it('does not truncate text shorter than max length', () => {
      const result = truncate('Short', 10);
      expect(result).toBe('Short');
    });

    it('does not truncate text equal to max length', () => {
      const result = truncate('Exactly10!', 10);
      expect(result).toBe('Exactly10!');
    });

    it('handles edge case of max length 3', () => {
      const result = truncate('Hello', 3);
      expect(result).toBe('...');
    });
  });

  describe('truncateWords', () => {
    it('truncates text to specified word count', () => {
      const result = truncateWords('This is a long sentence with many words', 3);
      expect(result).toBe('This is a...');
    });

    it('does not truncate if under word limit', () => {
      const result = truncateWords('Short text', 5);
      expect(result).toBe('Short text');
    });

    it('handles single word', () => {
      const result = truncateWords('Hello world test', 1);
      expect(result).toBe('Hello...');
    });

    it('handles multiple spaces between words', () => {
      const result = truncateWords('Word1   Word2   Word3', 2);
      expect(result).toBe('Word1 Word2...');
    });
  });

  describe('normalizeTrailingSlash', () => {
    it('removes trailing slash from paths', () => {
      expect(normalizeTrailingSlash('/about/')).toBe('/about');
    });

    it('preserves root slash', () => {
      expect(normalizeTrailingSlash('/')).toBe('/');
    });

    it('does not modify paths without trailing slash', () => {
      expect(normalizeTrailingSlash('/about')).toBe('/about');
    });

    it('handles multiple trailing slashes', () => {
      expect(normalizeTrailingSlash('/about///')).toBe('/about//');
    });
  });

  describe('slugify', () => {
    it('converts text to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('removes leading and trailing hyphens', () => {
      expect(slugify('  -Hello World-  ')).toBe('hello-world');
    });

    it('handles already slugified text', () => {
      expect(slugify('already-slugified')).toBe('already-slugified');
    });

    it('handles text with numbers', () => {
      expect(slugify('Test 123 Slug')).toBe('test-123-slug');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles underscores', () => {
      expect(slugify('hello_world_test')).toBe('hello-world-test');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('does not modify already capitalized text', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('only capitalizes first character', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });
});
