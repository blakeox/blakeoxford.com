import fs from 'fs';
import matter from 'gray-matter';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// Import our helpers
import * as mod from '../scripts/generate-search-index.js';

// Mock fs and gray-matter
// vi.mock('fs');
// vi.mock('gray-matter');

describe.skip('generate-search-index helpers (skipped)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFiles', () => {
    it('filters only .mdx files', () => {
      vi.spyOn(mod.fs, 'readdirSync').mockReturnValue(['post.mdx', 'readme.md', 'script.js']);
      const files = mod.getFiles('dummyDir');
      expect(files).toEqual(['post.mdx']);
    });
  });

  describe('parseMDXFile', () => {
    it('parses frontmatter and constructs url', () => {
      const raw = '---\ntitle: Hello\ndescription: World\n---\nContent';
      vi.spyOn(mod.fs, 'readFileSync').mockReturnValue(raw);
      // Mock gray-matter
      vi.mocked(mod.matter).mockReturnValue({ data: { title: 'Hello', description: 'World' } });
      const result = mod.parseMDXFile('/base/path/file.mdx', '/blog');
      expect(result).toEqual({
        title: 'Hello',
        excerpt: 'World',
        url: '/blog/file'
      });
    });
  });

  describe('buildIndex', () => {
    it('builds index array using parseMDXFile', () => {
      // stub getFiles to return two file names
      vi.spyOn(mod, 'getFiles').mockReturnValue(['a.mdx', 'b.mdx']);
      // stub parseMDXFile
      vi.spyOn(mod, 'parseMDXFile').mockImplementation((filePath: string, baseUrl: string) => ({ title: filePath, excerpt: '', url: baseUrl + '/' + path.basename(filePath, '.mdx') }));
      const index = mod.buildIndex('src/content/blog', '/blog');
      expect(index).toHaveLength(2);
      expect(index[0].url).toBe('/blog/a');
      expect(index[1].url).toBe('/blog/b');
      vi.restoreAllMocks();
    });
  });
});
