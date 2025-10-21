/**
 * Array Utility Tests
 * Comprehensive tests for array manipulation functions
 */
import { describe, it, expect } from 'vitest';
import { take, shuffle, groupBy } from '../../../src/utils/index';

describe('Array Utilities', () => {
  describe('take', () => {
    it('returns first n items from array', () => {
      const result = take([1, 2, 3, 4, 5], 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('returns entire array if count exceeds length', () => {
      const result = take([1, 2, 3], 10);
      expect(result).toEqual([1, 2, 3]);
    });

    it('returns empty array for count 0', () => {
      const result = take([1, 2, 3], 0);
      expect(result).toEqual([]);
    });

    it('handles empty array', () => {
      const result = take([], 5);
      expect(result).toEqual([]);
    });

    it('does not mutate original array', () => {
      const original = [1, 2, 3, 4, 5];
      take(original, 3);
      expect(original).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('shuffle', () => {
    it('returns array of same length', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result.length).toBe(input.length);
    });

    it('contains all original elements', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result.sort()).toEqual(input.sort());
    });

    it('does not mutate original array', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffle(original);
      expect(original).toEqual(copy);
    });

    it('handles single element array', () => {
      const result = shuffle([1]);
      expect(result).toEqual([1]);
    });

    it('handles empty array', () => {
      const result = shuffle([]);
      expect(result).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('groups items by key function', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const result = groupBy(items, item => item.type);
      expect(result).toEqual({
        a: [
          { type: 'a', value: 1 },
          { type: 'a', value: 3 },
        ],
        b: [{ type: 'b', value: 2 }],
      });
    });

    it('handles empty array', () => {
      const result = groupBy([], item => item);
      expect(result).toEqual({});
    });

    it('creates single group when all items have same key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'a', value: 2 },
      ];
      const result = groupBy(items, item => item.type);
      expect(result).toEqual({
        a: [
          { type: 'a', value: 1 },
          { type: 'a', value: 2 },
        ],
      });
    });

    it('works with string arrays', () => {
      const items = ['apple', 'apricot', 'banana', 'blueberry'];
      const result = groupBy(items, item => item[0]);
      expect(result).toEqual({
        a: ['apple', 'apricot'],
        b: ['banana', 'blueberry'],
      });
    });
  });
});
