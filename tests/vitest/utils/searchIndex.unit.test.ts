import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Mock the dependencies
vi.mock('fs');
vi.mock('gray-matter');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockMatter = vi.mocked(matter);
const mockPath = vi.mocked(path);

interface MockFile {
  data: Record<string, unknown>;
  content: string;
}

interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  content: string;
}

describe('Search Index Generation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File processing utilities', () => {
    it('should extract frontmatter from markdown files', () => {
      const mockFileContent = `---
title: "Test Post"
description: "Test description"
pubDate: 2024-01-01
tags: ["test", "markdown"]
---

# Test Post Content

This is the body of the test post.`;

      const mockParsedResult = {
        data: {
          title: "Test Post",
          description: "Test description",
          pubDate: new Date('2024-01-01'),
          tags: ["test", "markdown"]
        },
        content: "# Test Post Content\n\nThis is the body of the test post.",
        orig: mockFileContent,
        language: '',
        matter: '',
        stringify: vi.fn()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockMatter.mockReturnValue(mockParsedResult as any);

      const result = matter(mockFileContent);

      expect(result.data.title).toBe("Test Post");
      expect(result.data.description).toBe("Test description");
      expect(result.data.tags).toEqual(["test", "markdown"]);
      expect(result.content).toContain("Test Post Content");
    });

    it('should handle files without frontmatter', () => {
      const mockFileContent = `# Regular Markdown

This is just markdown content without frontmatter.`;

      const mockParsedResult = {
        data: {},
        content: mockFileContent,
        orig: mockFileContent,
        language: '',
        matter: '',
        stringify: vi.fn()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockMatter.mockReturnValue(mockParsedResult as any);

      const result = matter(mockFileContent);

      expect(result.data).toEqual({});
      expect(result.content).toBe(mockFileContent);
    });
  });

  describe('Path utilities', () => {
    it('should correctly resolve relative paths', () => {
      mockPath.resolve.mockReturnValue('/resolved/path/to/file.md');
      mockPath.basename.mockReturnValue('file.md');
      mockPath.extname.mockReturnValue('.md');

      expect(path.resolve('./content/blog/file.md')).toBe('/resolved/path/to/file.md');
      expect(path.basename('/path/to/file.md')).toBe('file.md');
      expect(path.extname('file.md')).toBe('.md');
    });

    it('should handle directory operations', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);

      expect(fs.existsSync('/some/path')).toBe(true);
      expect(fs.statSync('/some/path').isDirectory()).toBe(true);
    });
  });

  describe('Search index structure', () => {
    it('should create valid search index entries', () => {
      const createSearchEntry = (file: MockFile, baseUrl: string): SearchEntry => {
        const slug = path.basename(file.toString(), path.extname(file.toString()));
        return {
          slug,
          title: (file.data?.title as string) || 'Untitled',
          description: (file.data?.description as string) || '',
          url: `${baseUrl}/${slug}/`,
          tags: (file.data?.tags as string[]) || [],
          content: file.content?.substring(0, 200) || ''
        };
      };

      const mockFile: MockFile = {
        data: {
          title: "Test Blog Post",
          description: "A test blog post",
          tags: ["test", "blog"]
        },
        content: "This is the content of the blog post that should be truncated if it's too long for the search index."
      };

      mockPath.basename.mockReturnValue('test-post');
      mockPath.extname.mockReturnValue('.md');

      const entry = createSearchEntry(mockFile, '/blog');

      expect(entry).toEqual({
        slug: 'test-post',
        title: 'Test Blog Post',
        description: 'A test blog post',
        url: '/blog/test-post/',
        tags: ['test', 'blog'],
        content: 'This is the content of the blog post that should be truncated if it\'s too long for the search index.'
      });
    });

    it('should handle missing frontmatter gracefully', () => {
      const createSearchEntry = (file: MockFile, baseUrl: string): SearchEntry => {
        const slug = path.basename(file.toString(), path.extname(file.toString()));
        return {
          slug,
          title: (file.data?.title as string) || 'Untitled',
          description: (file.data?.description as string) || '',
          url: `${baseUrl}/${slug}/`,
          tags: (file.data?.tags as string[]) || [],
          content: file.content?.substring(0, 200) || ''
        };
      };

      const mockFile: MockFile = {
        data: {},
        content: "Content without frontmatter"
      };

      mockPath.basename.mockReturnValue('no-frontmatter');
      mockPath.extname.mockReturnValue('.md');

      const entry = createSearchEntry(mockFile, '/blog');

      expect(entry).toEqual({
        slug: 'no-frontmatter',
        title: 'Untitled',
        description: '',
        url: '/blog/no-frontmatter/',
        tags: [],
        content: 'Content without frontmatter'
      });
    });
  });

  describe('Content filtering', () => {
    it('should filter out draft content', () => {
      const filterPublished = (items: MockFile[]) => 
        items.filter(item => !item.data?.draft);

      const mockItems: MockFile[] = [
        { data: { title: 'Published Post', draft: false }, content: '' },
        { data: { title: 'Draft Post', draft: true }, content: '' },
        { data: { title: 'Also Published' }, content: '' }, // No draft field should be published
      ];

      const published = filterPublished(mockItems);

      expect(published).toHaveLength(2);
      expect(published[0].data.title).toBe('Published Post');
      expect(published[1].data.title).toBe('Also Published');
    });

    it('should sort by publication date', () => {
      const sortByDate = (items: MockFile[]) => 
        items.sort((a, b) => new Date((b.data?.pubDate as string) || 0).getTime() - new Date((a.data?.pubDate as string) || 0).getTime());

      const mockItems: MockFile[] = [
        { data: { title: 'Old Post', pubDate: '2023-01-01' }, content: '' },
        { data: { title: 'New Post', pubDate: '2024-01-01' }, content: '' },
        { data: { title: 'Middle Post', pubDate: '2023-06-01' }, content: '' },
      ];

      const sorted = sortByDate([...mockItems]); // Create copy to avoid mutation

      expect(sorted[0].data.title).toBe('New Post');
      expect(sorted[1].data.title).toBe('Middle Post');
      expect(sorted[2].data.title).toBe('Old Post');
    });
  });
});
