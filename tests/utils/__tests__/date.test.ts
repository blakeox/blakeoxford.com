/**
 * Date Utility Tests
 * Comprehensive tests for date formatting and parsing functions
 */
import { describe, it, expect } from 'vitest';
import {
  formatDateISO,
  formatDateShort,
  formatDateFull,
  formatDateBlog,
  safeParseDate,
} from '../../../src/utils/index';

describe('Date Utilities', () => {
  const testDate = new Date('2025-10-13T15:30:00.000Z');

  describe('formatDateISO', () => {
    it('formats Date object as ISO string', () => {
      const result = formatDateISO(testDate);
      expect(result).toBe('2025-10-13T15:30:00.000Z');
    });

    it('handles string input', () => {
      const result = formatDateISO('2025-10-13');
      expect(result).toContain('2025-10-13');
    });

    it('handles timestamp input', () => {
      const result = formatDateISO(testDate.getTime());
      expect(result).toBe('2025-10-13T15:30:00.000Z');
    });
  });

  describe('formatDateShort', () => {
    it('formats date as "MMM YYYY"', () => {
      const result = formatDateShort(testDate);
      expect(result).toMatch(/Oct 2025/);
    });

    it('handles different months', () => {
      const jan = new Date('2025-01-15');
      expect(formatDateShort(jan)).toMatch(/Jan 2025/);
    });
  });

  describe('formatDateFull', () => {
    it('formats date with full month name', () => {
      const result = formatDateFull(testDate);
      expect(result).toMatch(/October 13, 2025/);
    });

    it('includes day in output', () => {
      const result = formatDateFull(testDate);
      expect(result).toContain('13');
    });
  });

  describe('formatDateBlog', () => {
    it('formats date for blog posts', () => {
      const result = formatDateBlog(testDate);
      expect(result).toMatch(/Oct 13, 2025/);
    });

    it('uses short month name', () => {
      const result = formatDateBlog(testDate);
      expect(result).not.toContain('October');
      expect(result).toContain('Oct');
    });
  });

  describe('safeParseDate', () => {
    it('returns valid date for valid input', () => {
      const result = safeParseDate('2025-10-13');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
    });

    it('returns current date for null input', () => {
      const result = safeParseDate(null);
      expect(result).toBeInstanceOf(Date);
    });

    it('returns current date for undefined input', () => {
      const result = safeParseDate(undefined);
      expect(result).toBeInstanceOf(Date);
    });

    it('returns current date for invalid date string', () => {
      const result = safeParseDate('invalid-date');
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(false);
    });
  });
});
