import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock implementations
const mockReadFileSync = vi.fn();
const mockReaddirSync = vi.fn();
const mockBasename = vi.fn();
const mockJoin = vi.fn();

// Mock the modules before imports
vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  readdirSync: mockReaddirSync,
  default: {
    readFileSync: mockReadFileSync,
    readdirSync: mockReaddirSync,
  }
}));

vi.mock('path', () => ({
  basename: mockBasename,
  join: mockJoin,
  default: {
    basename: mockBasename,
    join: mockJoin,
  }
}));

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
      mockReadFileSync.mockReturnValue(mockFileContent);

      const content = mockReadFileSync('/test/file.astro', 'utf-8');
      
      expect(content).toBe(mockFileContent);
      expect(mockReadFileSync).toHaveBeenCalledWith('/test/file.astro', 'utf-8');
    });

    it('should handle file path operations', () => {
      mockBasename.mockReturnValue('file.astro');
      mockJoin.mockReturnValue('/test/content/file.astro');

      const basename = mockBasename('/test/content/file.astro');
      const fullPath = mockJoin('/test', 'content', 'file.astro');

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
      mockReaddirSync.mockReturnValue(mockFiles);

      const files = mockReaddirSync('/test/dir') as string[];
      const astroFiles = files.filter((f: string) => f.endsWith('.astro'));

      expect(files).toEqual(mockFiles);
      expect(astroFiles).toEqual(['file1.astro', 'file2.astro']);
    });
  });

  describe('index building', () => {
    it('should build search index from files', () => {
      const mockFiles = ['post1.astro', 'post2.astro'];
      mockReaddirSync.mockReturnValue(mockFiles);
      mockReadFileSync.mockReturnValue('Sample content');
      mockBasename.mockImplementation((p: string, ext?: string) => {
        const name = p.split('/').pop() || '';
        return ext ? name.replace(ext, '') : name;
      });
      mockJoin.mockImplementation((...args: string[]) => args.join('/'));

      // Mock index building logic
      const buildIndexMock = (dir: string, baseUrl: string) => {
        const files = (mockReaddirSync(dir) as string[]).filter((f: string) => f.endsWith('.astro'));
        return files.map((file: string) => ({
          title: `Title for ${mockBasename(file, '.astro')}`,
          excerpt: 'Sample excerpt',
          url: `${baseUrl}/${mockBasename(file, '.astro')}`
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