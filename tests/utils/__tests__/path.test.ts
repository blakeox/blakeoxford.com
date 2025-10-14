/**
 * URL & Path Utility Tests
 * Comprehensive tests for URL and path manipulation functions
 */
import { describe, it, expect } from 'vitest';
import { getBasename, getExtension, joinPath } from '../../../src/utils/index';

describe('URL & Path Utilities', () => {
  describe('getBasename', () => {
    it('extracts filename without extension', () => {
      expect(getBasename('/path/to/file.jpg')).toBe('file');
    });

    it('handles paths without extension', () => {
      expect(getBasename('/path/to/file')).toBe('file');
    });

    it('handles files with multiple dots', () => {
      expect(getBasename('/path/to/file.backup.tar.gz')).toBe('file.backup.tar');
    });

    it('handles root-level files', () => {
      expect(getBasename('file.txt')).toBe('file');
    });

    it('handles empty path', () => {
      expect(getBasename('')).toBe('');
    });
  });

  describe('getExtension', () => {
    it('extracts file extension', () => {
      expect(getExtension('/path/to/file.jpg')).toBe('jpg');
    });

    it('returns empty string for files without extension', () => {
      expect(getExtension('/path/to/file')).toBe('');
    });

    it('handles multiple dots in filename', () => {
      expect(getExtension('/path/to/file.tar.gz')).toBe('gz');
    });

    it('converts extension to lowercase', () => {
      expect(getExtension('/path/to/file.JPG')).toBe('jpg');
    });

    it('handles root-level files', () => {
      expect(getExtension('file.txt')).toBe('txt');
    });
  });

  describe('joinPath', () => {
    it('joins path segments with single slashes', () => {
      expect(joinPath('/base', 'path', 'file')).toBe('/base/path/file');
    });

    it('handles segments with trailing slashes', () => {
      expect(joinPath('/base/', 'path/', 'file')).toBe('/base/path/file');
    });

    it('handles segments with leading slashes', () => {
      expect(joinPath('/base', '/path', '/file')).toBe('/base/path/file');
    });

    it('handles empty segments', () => {
      expect(joinPath('/base', '', 'file')).toBe('/base/file');
    });

    it('handles single segment', () => {
      expect(joinPath('/base')).toBe('/base');
    });

    it('handles relative paths', () => {
      expect(joinPath('base', 'path', 'file')).toBe('base/path/file');
    });
  });
});
