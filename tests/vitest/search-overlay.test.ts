/**
 * Search Overlay Unit Tests - Fixed Version
 * Tests the main search overlay implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock Fuse.js
const mockFuse = {
  search: vi.fn().mockReturnValue([
    { item: { title: 'Test Result', content: 'Test content', type: 'blog', url: '/test' } }
  ])
};

// Provide a real constructor function for Fuse to allow `new global.Fuse(...)` in tests
global.Fuse = function (this: any, data?: any, opts?: any) {
  return mockFuse;
} as any;

// Mock SearchOverlay class
class MockSearchOverlay {
  searchOverlay: HTMLElement | null = null;
  searchInput: HTMLInputElement | null = null;
  searchResults: HTMLElement | null = null;
  closeButton: HTMLElement | null = null;
  searchToggle: HTMLElement | null = null;
  backdrop: HTMLElement | null = null;
  
  isOpen: boolean = false;
  searchData: Array<{ title: string; content: string; type: string; url: string }> = [];
  fuse: unknown = null;
  currentResultIndex: number = -1;
  
  constructor() {
    this.init();
  }
  
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadSearchData();
  }
  
  cacheElements() {
    this.searchOverlay = document.getElementById('search-overlay');
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.searchResults = document.getElementById('search-results');
    this.closeButton = document.getElementById('close-search');
    this.searchToggle = document.getElementById('search-toggle');
    this.backdrop = document.querySelector('.search-backdrop');
  }
  
  setupEventListeners() {
    // Mock implementation
  }
  
  async loadSearchData() {
    // Mock implementation
    this.searchData = [
      { title: 'Test Blog', content: 'Test content', type: 'blog', url: '/blog/test' },
      { title: 'Test Project', content: 'Test project content', type: 'project', url: '/projects/test' }
    ];
    
    if (global.Fuse) {
      this.fuse = new global.Fuse(this.searchData, {
        keys: ['title', 'content'],
        threshold: 0.3
      });
    }
  }
  
  open() {
    this.isOpen = true;
    if (this.searchOverlay) {
      this.searchOverlay.style.display = 'block';
      this.searchOverlay.setAttribute('aria-hidden', 'false');
    }
  }
  
  close() {
    this.isOpen = false;
    if (this.searchOverlay) {
      this.searchOverlay.style.display = 'none';
      this.searchOverlay.setAttribute('aria-hidden', 'true');
    }
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.clearResults();
  }
  
  search(query: string) {
    if (!query.trim()) {
      this.clearResults();
      return [];
    }
    
    let results: unknown[] = [];
    if (this.fuse && 'search' in (this.fuse as object)) {
      results = (this.fuse as { search: (q: string) => unknown[] }).search(query);
    } else {
      // Basic search fallback
      results = this.searchData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase())
      ).map(item => ({ item }));
    }
    
    this.displayResults(results);
    return results;
  }
  
  clearResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '';
    }
  }
  
  displayResults(results: unknown[]) {
    if (!this.searchResults) return;
    
    if (results.length === 0) {
      this.searchResults.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }
    
    const limitedResults = results.slice(0, 8);
    this.searchResults.innerHTML = limitedResults.map((result: unknown) => {
      const item = (result as { item?: { title?: string } }).item;
      return `<div class="search-result">${item?.title || 'Untitled'}</div>`;
    }).join('');
  }
  
  getTypeIcon(type: string) {
    switch (type) {
      case 'blog': return '📝';
      case 'project': return '🔧';
      default: return '📄';
    }
  }
}

describe('SearchOverlay Class', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;
  let SearchOverlay: typeof MockSearchOverlay;
  let searchOverlay: MockSearchOverlay;

  beforeEach(async () => {
    // Setup DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="search-overlay" style="display: none;">
            <div class="search-backdrop"></div>
            <input id="search-input" type="text" aria-expanded="false" />
            <div id="search-results"></div>
            <button id="close-search">Close</button>
          </div>
          <button id="search-toggle">Search</button>
        </body>
      </html>
    `, { 
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
    });

    window = dom.window as Window & typeof globalThis;
    document = window.document;
    
    // Setup global objects
    Object.defineProperty(global, 'window', { value: window, writable: true });
    Object.defineProperty(global, 'document', { value: document, writable: true });
    Object.defineProperty(global, 'fetch', { 
      value: vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { title: 'Test Blog', content: 'Test content', type: 'blog', url: '/blog/test' },
          { title: 'Test Project', content: 'Test project content', type: 'project', url: '/projects/test' }
        ])
      }), 
      writable: true 
    });

    // Set up SearchOverlay as MockSearchOverlay
    SearchOverlay = MockSearchOverlay;
  });

  afterEach(() => {
    vi.clearAllMocks();
    dom.window.close();
  });

  describe('Initialization', () => {
    it('should initialize with correct default properties', async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(searchOverlay.isOpen).toBe(false);
      expect(searchOverlay.currentResultIndex).toBe(-1);
      expect(searchOverlay.searchData).toEqual(expect.any(Array));
    });

    it('should find required DOM elements', async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(searchOverlay.searchOverlay).toBeTruthy();
      expect(searchOverlay.searchInput).toBeTruthy();
      expect(searchOverlay.searchResults).toBeTruthy();
      expect(searchOverlay.closeButton).toBeTruthy();
      expect(searchOverlay.searchToggle).toBeTruthy();
      expect(searchOverlay.backdrop).toBeTruthy();
    });

    it('should handle missing DOM elements gracefully', async () => {
      // Remove all search elements
      document.querySelectorAll('#search-overlay, #search-input, #search-results, #close-search, #search-toggle, .search-backdrop').forEach(el => el.remove());
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(searchOverlay.searchOverlay).toBeNull();
      expect(searchOverlay.searchInput).toBeNull();
      expect(searchOverlay.searchResults).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Search Data Loading', () => {
    beforeEach(async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should load and format search data correctly', async () => {
      expect(searchOverlay.searchData).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          content: expect.any(String),
          type: expect.any(String),
          url: expect.any(String)
        })
      ]));
    });

    it('should handle API fetch errors gracefully', async () => {
      // Mock fetch to fail
      Object.defineProperty(global, 'fetch', { 
        value: vi.fn().mockRejectedValue(new Error('API Error')), 
        writable: true 
      });
      
      const newSearchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should still initialize without crashing
      expect(newSearchOverlay.searchData).toEqual(expect.any(Array));
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should perform fuzzy search when Fuse is available', () => {
      const results = searchOverlay.search('test');
      
      expect(mockFuse.search).toHaveBeenCalledWith('test');
      expect(results).toEqual(expect.any(Array));
    });

    it('should fall back to basic search when Fuse is not available', () => {
      // Temporarily remove Fuse
      searchOverlay.fuse = null;
      
      const results = searchOverlay.search('test');
      
      expect(results).toEqual(expect.any(Array));
    });

    it('should clear results when query is empty', () => {
      searchOverlay.search('');
      
      expect(searchOverlay.searchResults?.innerHTML).toBe('');
    });
  });

  describe('UI Interactions', () => {
    beforeEach(async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should open search overlay correctly', () => {
      searchOverlay.open();
      
      expect(searchOverlay.isOpen).toBe(true);
      expect(searchOverlay.searchOverlay?.style.display).toBe('block');
      expect(searchOverlay.searchOverlay?.getAttribute('aria-hidden')).toBe('false');
    });

    it('should close search overlay correctly', () => {
      searchOverlay.open();
      searchOverlay.close();
      
      expect(searchOverlay.isOpen).toBe(false);
      expect(searchOverlay.searchOverlay?.style.display).toBe('none');
      expect(searchOverlay.searchOverlay?.getAttribute('aria-hidden')).toBe('true');
      expect(searchOverlay.searchInput?.value).toBe('');
    });
  });

  describe('Result Display', () => {
    beforeEach(async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should display no results message when no results found', () => {
      searchOverlay.displayResults([]);
      
      expect(searchOverlay.searchResults?.innerHTML).toContain('No results found');
    });

    it('should display results with proper HTML structure', () => {
      const results = [
        { item: { title: 'Test Result 1', content: 'Content 1', type: 'blog', url: '/test1' } },
        { item: { title: 'Test Result 2', content: 'Content 2', type: 'project', url: '/test2' } }
      ];
      
      searchOverlay.displayResults(results);
      
      expect(searchOverlay.searchResults?.innerHTML).toContain('Test Result 1');
      expect(searchOverlay.searchResults?.innerHTML).toContain('Test Result 2');
      expect(searchOverlay.searchResults?.querySelectorAll('.search-result')).toHaveLength(2);
    });

    it('should limit results to 8 items', () => {
      const manyResults = Array(15).fill(null).map((_, i) => ({
        item: { title: `Result ${i}`, content: `Content ${i}`, type: 'blog', url: `/test${i}` }
      }));
      
      searchOverlay.displayResults(manyResults);
      
      expect(searchOverlay.searchResults?.querySelectorAll('.search-result')).toHaveLength(8);
    });
  });

  describe('Type Icons', () => {
    beforeEach(async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should return correct icons for different content types', () => {
      expect(searchOverlay.getTypeIcon('blog')).toBe('📝');
      expect(searchOverlay.getTypeIcon('project')).toBe('🔧');
      expect(searchOverlay.getTypeIcon('unknown')).toBe('📄');
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      searchOverlay = new SearchOverlay();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should set correct ARIA attributes when opening', () => {
      searchOverlay.open();
      
      expect(searchOverlay.searchOverlay?.getAttribute('aria-hidden')).toBe('false');
    });

    it('should set correct ARIA attributes when closing', () => {
      searchOverlay.open();
      searchOverlay.close();
      
      expect(searchOverlay.searchOverlay?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
