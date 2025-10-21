/**
 * Object Utility Tests
 * Comprehensive tests for object manipulation functions
 */
import { describe, it, expect } from 'vitest';
import { deepClone, isPlainObject, omit, pick } from '../../../src/utils/index';

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('creates deep copy of object', () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.a).not.toBe(original.a);
    });

    it('handles arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('handles null', () => {
      expect(deepClone(null)).toBe(null);
    });

    it('handles primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
    });
  });

  describe('isPlainObject', () => {
    it('returns true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });

    it('returns false for arrays', () => {
      expect(isPlainObject([])).toBe(false);
    });

    it('returns false for null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isPlainObject(42)).toBe(false);
      expect(isPlainObject('test')).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });

    it('returns false for Date objects', () => {
      expect(isPlainObject(new Date())).toBe(false);
    });
  });

  describe('omit', () => {
    it('omits specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, 'b');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('omits multiple keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, 'b', 'd');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('does not mutate original object', () => {
      const obj = { a: 1, b: 2 };
      omit(obj, 'b');
      expect(obj).toEqual({ a: 1, b: 2 });
    });

    it('handles non-existent keys gracefully', () => {
      const obj = { a: 1, b: 2 };
      const result = omit(obj, 'c' as any);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('pick', () => {
    it('picks specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, 'a', 'c');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('picks single key', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, 'b');
      expect(result).toEqual({ b: 2 });
    });

    it('does not mutate original object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      pick(obj, 'a');
      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('ignores non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(obj, 'a', 'c' as any);
      expect(result).toEqual({ a: 1 });
    });
  });
});
