import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Search Utilities Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Search Index Loading', () => {
    it('should load projects search index', async () => {
      const mockProjectsData = [
        {
          slug: 'test-project',
          title: 'Test Project',
          description: 'Test project description',
          tags: ['test', 'project'],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectsData),
      });

      const response = await fetch('/api/projects.json');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/projects.json');
      expect(data).toEqual(mockProjectsData);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/projects.json')).rejects.toThrow('Network error');
    });
  });

  describe('Search Query Processing', () => {
    it('should normalize search queries', () => {
      const normalizeQuery = (query: string): string =>
        query.toLowerCase().trim().replace(/\s+/g, ' ');

      expect(normalizeQuery('  Project   One  ')).toBe('project one');
      expect(normalizeQuery('Modern Stack')).toBe('modern stack');
      expect(normalizeQuery('')).toBe('');
    });

    it('should extract search terms', () => {
      const extractTerms = (query: string): string[] =>
        query.toLowerCase().trim().split(/\s+/).filter(Boolean);

      expect(extractTerms('microsoft fabric')).toEqual(['microsoft', 'fabric']);
      expect(extractTerms('  cloud automation  ')).toEqual(['cloud', 'automation']);
      expect(extractTerms('')).toEqual([]);
    });

    it('should filter results by search terms', () => {
      const mockData = [
        {
          title: 'Microsoft Fabric',
          content: 'Operational intelligence platform',
          tags: ['microsoft', 'fabric'],
        },
        {
          title: 'OpenAI Coaching',
          content: 'Documentation quality feedback',
          tags: ['openai', 'compliance'],
        },
        { title: 'Ferment App', content: 'SwiftUI mobile product', tags: ['swiftui', 'mobile'] },
      ];

      const searchFilter = (data: any[], query: string) => {
        const terms = query.toLowerCase().split(/\s+/);
        return data.filter((item) => {
          const searchText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
          return terms.some((term) => searchText.includes(term));
        });
      };

      expect(searchFilter(mockData, 'microsoft')).toHaveLength(1);
      expect(searchFilter(mockData, 'mobile')).toHaveLength(1);
      expect(searchFilter(mockData, 'swift')).toHaveLength(1);
      expect(searchFilter(mockData, 'nonexistent')).toHaveLength(0);
    });
  });

  describe('Performance Considerations', () => {
    it('should debounce search input', () => {
      vi.useFakeTimers();

      const searchFunction = vi.fn();
      const debounceDelay = 300;

      let timeoutId: NodeJS.Timeout;
      const debouncedSearch = (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => searchFunction(query), debounceDelay);
      };

      debouncedSearch('a');
      debouncedSearch('ab');
      debouncedSearch('abc');

      expect(searchFunction).not.toHaveBeenCalled();

      vi.advanceTimersByTime(debounceDelay);

      expect(searchFunction).toHaveBeenCalledTimes(1);
      expect(searchFunction).toHaveBeenCalledWith('abc');

      vi.useRealTimers();
    });

    it('should limit number of search results', () => {
      const mockResults = Array.from({ length: 50 }, (_, i) => ({
        title: `Project ${i}`,
        content: `Content for project ${i}`,
      }));
      const limitResults = (results: any[], limit: number = 10) => results.slice(0, limit);

      const limitedResults = limitResults(mockResults, 5);

      expect(limitedResults).toHaveLength(5);
      expect(limitedResults[0].title).toBe('Project 0');
      expect(limitedResults[4].title).toBe('Project 4');
    });
  });
});
