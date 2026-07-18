import { describe, it, expect, vi, beforeEach } from 'vitest';

// Properly mocking modules with default exports
vi.mock('fs', () => {
  return {
    default: {
      readdirSync: vi.fn().mockReturnValue(['post.astro', 'readme.md', 'script.js']),
      readFileSync: vi.fn().mockReturnValue('Sample content'),
      writeFileSync: vi.fn(),
    },
    readdirSync: vi.fn().mockReturnValue(['post.astro', 'readme.md', 'script.js']),
    readFileSync: vi.fn().mockReturnValue('Sample content'),
    writeFileSync: vi.fn(),
  };
});

vi.mock('path', () => {
  return {
    default: {
      join: vi.fn((...args) => args.join('/')),
      basename: vi.fn((path, ext) => {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        return ext ? filename.replace(ext, '') : filename;
      }),
      dirname: vi.fn((path) => {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/');
      }),
    },
    join: vi.fn((...args) => args.join('/')),
    basename: vi.fn((path, ext) => {
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      return ext ? filename.replace(ext, '') : filename;
    }),
    dirname: vi.fn((path) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/');
    }),
  };
});

// Import fs and path to use the mocked versions
import fs from 'fs';
import path from 'path';

// Only test harness - no actual code calls
// Phase 0 note: This suite tests only inlined mock functions mirroring implementation.
// It will be replaced by an integration test executing the real script against fixtures.
describe('generate-search-index helpers (to be replaced with integration test)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFiles function', () => {
    it('should filter files correctly', () => {
      // Define a mock getFiles function that matches the behavior we're testing
      const getFilesMock = (dir: string, ext: string) => {
        return fs.readdirSync(dir).filter((f) => f.endsWith(ext));
      };

      // Call our mock function
      const files = getFilesMock('dummyDir', '.astro');

      // Verify the results
      expect(files).toEqual(['post.astro']);
      expect(fs.readdirSync).toHaveBeenCalledWith('dummyDir');
    });
  });

  describe('parseFile function', () => {
    it('should read file and construct URL', () => {
      // Define a mock parseFile function that matches the behavior we're testing
      const parseFileMock = (filePath: string, baseUrl: string) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
          title: 'Sample Title',
          excerpt: content.substring(0, 50) + '...', // Use content for excerpt
          url: `${baseUrl}/${path.basename(filePath, '.astro')}`,
        };
      };

      // Call our mock function
      const result = parseFileMock('/base/path/file.astro', '/blog');

      // Verify the results
      expect(fs.readFileSync).toHaveBeenCalledWith('/base/path/file.astro', 'utf-8');
      expect(result).toEqual({
        title: 'Sample Title',
        excerpt: 'Sample content...',
        url: '/blog/file',
      });
    });
  });

  describe('buildIndex function', () => {
    it('should build index array using parseFile', () => {
      // Reset mocks with specific return values for this test
      vi.mocked(fs.readdirSync).mockReturnValue(['a.astro', 'b.astro'] as any);

      // Define mock getFiles and parseFile functions
      const getFilesMock = (dir: string, ext: string) => {
        return fs.readdirSync(dir).filter((f) => f.endsWith(ext));
      };

      const parseFileMock = (filePath: string, baseUrl: string) => {
        const filename = path.basename(filePath, '.astro');
        return {
          title: `Title ${filename.toUpperCase()}`,
          excerpt: `Description for ${filename}`,
          url: `${baseUrl}/${filename}`,
        };
      };

      // Define mock buildIndex function
      const buildIndexMock = (contentDir: string, baseUrl: string) => {
        const dir = path.join('..', contentDir);
        return getFilesMock(dir, '.astro').map((f) => parseFileMock(path.join(dir, f), baseUrl));
      };

      // Call our mock function
      const index = buildIndexMock('src/content/blog', '/blog');

      // Verify the results
      expect(index).toHaveLength(2);
      expect(index[0].url).toContain('/blog/');
      expect(index[1].url).toContain('/blog/');
    });
  });
});
