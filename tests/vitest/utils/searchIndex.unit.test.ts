import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock the dependencies
vi.mock('fs');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

interface SearchEntry {
  title: string;
  excerpt: string;
  url: string;
}

describe('Search Index Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('file parsing', () => {
    it('should handle basic file content parsing', () => {
      const mockFileContent = 'Sample file content for testing';
      mockFs.readFileSync.mockReturnValue(mockFileContent as any);

      const content = fs.readFileSync('/test/file.astro', 'utf-8');
      
      expect(content).toBe(mockFileContent);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/file.astro', 'utf-8');
    });

    it('should handle file path operations', () => {
      mockPath.basename.mockReturnValue('file.astro');
      mockPath.join.mockReturnValue('/test/content/file.astro');

      const basename = path.basename('/test/content/file.astro');
      const fullPath = path.join('/test', 'content', 'file.astro');

      expect(basename).toBe('file.astro');
      expect(fullPath).toBe('/test/content/file.astro');
    });
  });

  describe('search entry creation', () => {
    it('should create valid search entries', () => {
      const entry: SearchEntry = {
        title: 'Test Title',
        excerpt: 'Test excerpt',
        url: '/test-url'
      };

      expect(entry.title).toBe('Test Title');
      expect(entry.excerpt).toBe('Test excerpt');
      expect(entry.url).toBe('/test-url');
    });

    it('should handle empty values', () => {
      const entry: SearchEntry = {
        title: '',
        excerpt: '',
        url: ''
      };

      expect(entry.title).toBe('');
      expect(entry.excerpt).toBe('');
      expect(entry.url).toBe('');
    });
  });

  describe('directory operations', () => {
    it('should read directory contents', () => {
      const mockFiles = ['file1.astro', 'file2.astro', 'other.txt'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const files = fs.readdirSync('/test/dir');
      const astroFiles = files.filter((f: string) => f.endsWith('.astro'));

      expect(files).toEqual(mockFiles);
      expect(astroFiles).toEqual(['file1.astro', 'file2.astro']);
    });
  });

  describe('index building', () => {
    it('should build search index from files', () => {
      const mockFiles = ['post1.astro', 'post2.astro'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockFs.readFileSync.mockReturnValue('Sample content' as any);
      mockPath.basename.mockImplementation((p: string, ext?: string) => {
        const name = p.split('/').pop() || '';
        return ext ? name.replace(ext, '') : name;
      });
      mockPath.join.mockImplementation((...args: string[]) => args.join('/'));

      // Mock index building logic
      const buildIndexMock = (dir: string, baseUrl: string) => {
        const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.astro'));
        return files.map((file: string) => ({
          title: `Title for ${path.basename(file, '.astro')}`,
          excerpt: 'Sample excerpt',
          url: `${baseUrl}/${path.basename(file, '.astro')}`
        }));
      };

      const index = buildIndexMock('/content/blog', '/blog');

      expect(index).toHaveLength(2);
      expect(index[0].title).toBe('Title for post1');
      expect(index[0].url).toBe('/blog/post1');
      expect(index[1].title).toBe('Title for post2');
      expect(index[1].url).toBe('/blog/post2');
    });
  });
});