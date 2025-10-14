/**
 * Validation Utility Tests
 * Comprehensive tests for validation functions
 */
import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidUrl, isNotEmpty } from '../../../src/utils/index';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('validates correct email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('invalid @domain.com')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('validates correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('invalid')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('//example.com')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('validates URLs with query parameters', () => {
      expect(isValidUrl('https://example.com?param=value')).toBe(true);
    });

    it('validates URLs with fragments', () => {
      expect(isValidUrl('https://example.com#section')).toBe(true);
    });
  });

  describe('isNotEmpty', () => {
    it('returns true for non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('  text  ')).toBe(true);
    });

    it('returns false for empty strings', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty('\t\n')).toBe(false);
    });

    it('trims whitespace before checking', () => {
      expect(isNotEmpty('  a  ')).toBe(true);
    });
  });
});
