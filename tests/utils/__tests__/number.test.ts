/**
 * Number Utility Tests
 * Comprehensive tests for number manipulation functions
 */
import { describe, it, expect } from 'vitest';
import { clamp, randomInt, formatNumber } from '../../../src/utils/index';

describe('Number Utilities', () => {
  describe('clamp', () => {
    it('clamps value to max when above', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('clamps value to min when below', () => {
      expect(clamp(-50, 0, 100)).toBe(0);
    });

    it('returns value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('handles equal min and max', () => {
      expect(clamp(50, 75, 75)).toBe(75);
    });

    it('handles negative ranges', () => {
      expect(clamp(-5, -10, -2)).toBe(-5);
      expect(clamp(-15, -10, -2)).toBe(-10);
    });
  });

  describe('randomInt', () => {
    it('generates number within range', () => {
      const result = randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('handles single value range', () => {
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });

    it('generates different values over multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(randomInt(1, 100));
      }
      // Should generate at least 10 different values in 100 calls
      expect(results.size).toBeGreaterThan(10);
    });
  });

  describe('formatNumber', () => {
    it('formats large numbers with commas', () => {
      expect(formatNumber(1234567)).toContain(',');
    });

    it('handles numbers under 1000', () => {
      expect(formatNumber(999)).toBe('999');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      const result = formatNumber(-1234567);
      expect(result).toContain('-');
      expect(result).toContain(',');
    });
  });
});
