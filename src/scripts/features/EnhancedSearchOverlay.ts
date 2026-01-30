/**
 * Enhanced search overlay with voice search, categories, and suggestions
 */
// Load vendored Fuse.js on demand to avoid bundling it into main JS
import { createModuleError, handleError } from '../../utils/AppError';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  category: string;
  type: 'project' | 'blog' | 'page';
  score?: number;
  matches?: readonly any[];
}

interface SearchSuggestion {
  text: string;
  category: string;
}

export class EnhancedSearchOverlay {
  private searchInput: HTMLInputElement | null;
  private searchResults: HTMLElement | null;
  private voiceSearchBtn: HTMLElement | null;
  private categoryButtons: NodeListOf<Element>;
  private closeButton: HTMLElement | null;
  private currentCategory: string;
  private searchTimeout: number | null;
  private recognition: any;  
  private isListening: boolean;

  constructor() {
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.searchResults = document.getElementById('search-results');
    this.voiceSearchBtn = document.getElementById('voice-search');
    this.categoryButtons = document.querySelectorAll('.search-category');
    this.closeButton = document.getElementById('close-search');
    this.currentCategory = 'all';
    this.searchTimeout = null;
    this.recognition = null;
    this.isListening = false;
    
    this.init();
  }
  
  /**
   * Open the search overlay programmatically
   */
  open() {
    const searchOverlay = document.getElementById('search-overlay');
    if (!searchOverlay) return false;
    try {
      // Remove authoritative closed flag if user explicitly opens overlay
      if (searchOverlay.hasAttribute && searchOverlay.hasAttribute('data-authoritative-closed')) {
        try { searchOverlay.removeAttribute('data-authoritative-closed'); } catch (e) { /* noop */ }
      }
      if (searchOverlay.hasAttribute && searchOverlay.hasAttribute('data-closed-lock')) { return false; }
    } catch (e) {}
    // Make overlay interactive and update ARIA/state so tests detect it
    (searchOverlay as any).inert = false;
    searchOverlay.dataset.state = 'open';
    searchOverlay.setAttribute('aria-hidden', 'false');
    searchOverlay.classList.add('active');
    searchOverlay.style.display = 'block';
    searchOverlay.style.visibility = 'visible';
    searchOverlay.style.opacity = '1';
    
    // Focus search input
    if (this.searchInput) {
      setTimeout(() => {
        this.searchInput?.focus();
      }, 100);
    }
    
    // Disable body scroll for mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    this.announceToScreenReader('Search overlay opened');
    this.trackSearchInteraction('opened');
    
    return true;
  }
  
  init() {
    this.setupVoiceSearch();
    this.setupSearchInput();
    this.setupCategories();
    this.setupKeyboardNavigation();
    this.setupCloseButton();
    this.setupBackdropClick();
    this.loadSearchHistory();
    
    // Set default active category
    this.setActiveCategory('all');
    
    console.log('✅ Enhanced SearchOverlay initialized with new design');
  }
  
  setupCloseButton() {
    if (!this.closeButton) return;
    
    this.closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeSearchOverlay();
    });
  }
  
  setupBackdropClick() {
    const backdrop = document.querySelector('.search-backdrop');
    if (!backdrop) return;
    
    backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeSearchOverlay();
    });
  }
  
  setupVoiceSearch() {
    if (!this.voiceSearchBtn) return;
    
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Support vendor-prefixed SpeechRecognition in browsers
      // cast to any to satisfy TypeScript in mixed runtime environments
      const SpeechRec: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = SpeechRec ? new SpeechRec() : null;
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.voiceSearchBtn?.classList.add('listening');
        this.voiceSearchBtn?.setAttribute('aria-label', 'Listening... Click to stop');
        this.announceToScreenReader('Voice search started. Please speak now.');
      };
      
      this.recognition.onresult = (event: any) => {  
        const transcript = event.results[0][0].transcript;
        if (this.searchInput) {
          this.searchInput.value = transcript;
          this.performSearch(transcript);
        }
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        this.voiceSearchBtn?.classList.remove('listening');
        this.voiceSearchBtn?.setAttribute('aria-label', 'Voice search (click to start)');
      };
      
      this.recognition.onerror = (event: any) => {  
        const errorEvent = event;
        const error = createModuleError('SearchOverlay', 'VOICE_SEARCH_ERROR', `Speech recognition error: ${errorEvent.error}`, {
          component: 'VoiceSearch',
          action: 'recognition',
          additionalData: { errorType: errorEvent.error }
        });
        handleError(error);
        this.announceToScreenReader(`Voice search error: ${errorEvent.error}`);
      };
      
      this.voiceSearchBtn.addEventListener('click', () => {
        if (this.isListening) {
          this.recognition.stop();
        } else {
          this.recognition.start();
        }
      });
    } else {
      // Hide voice search button if not supported
      this.voiceSearchBtn.style.display = 'none';
    }
  }
  
  setupSearchInput() {
    if (!this.searchInput) return;
    
    this.searchInput.addEventListener('focus', () => {
      this.trackSearchInteraction('input_focused');
    });
    
    this.searchInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const query = target.value.trim();
      
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Debounce search
      this.searchTimeout = window.setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });
    
    this.searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeSearchOverlay();
      }
    });
  }
  
  setupCategories() {
    this.categoryButtons.forEach((button: Element) => {
      button.addEventListener('click', () => {
        const category = (button as HTMLElement).dataset.category;
        if (category) {
          this.setActiveCategory(category);
          this.performSearch(this.searchInput?.value || '');
        }
      });
    });
  }
  
  setActiveCategory(category: string) {
    this.currentCategory = category;
    
    this.categoryButtons.forEach((button: Element) => {
      const btn = button as HTMLElement;
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  async performSearch(query: string) {
    if (!query) {
      this.showSearchSuggestions();
      return;
    }
    
    try {
      // Show loading state
      this.showLoadingState();
      
      // Track search analytics
      this.trackSearchInteraction('performed', { 
        query, 
        category: this.currentCategory 
      });
      
      // Perform search
      const results = await this.searchContent(query, this.currentCategory);
      
      // Track results
      this.trackSearchInteraction('results_shown', { 
        query, 
        category: this.currentCategory,
        results_count: results.length 
      });
      
      this.displayResults(results, query);
      this.saveToSearchHistory(query);
      
    } catch (error) {
      const appError = createModuleError('SearchOverlay', 'SEARCH_EXECUTION_ERROR', 
        `Search execution failed: ${(error as Error)?.message || 'Unknown error'}`, {
          component: 'SearchExecution',
          action: 'search',
          additionalData: { query, category: this.currentCategory }
        });
      handleError(appError);
      
      this.trackSearchInteraction('error', { 
        query, 
        category: this.currentCategory,
        error: (error as Error)?.message || 'Unknown error' 
      });
      this.showErrorState();
    }
  }
  
  async searchContent(query: string, category: string): Promise<SearchResult[]> {
    try {
  // Ensure Fuse is available (lazy-load vendored script if needed)
  const FuseCtor = await this.ensureFuse();
      // Load search indices
      const [projectsData, blogData, pagesData] = await Promise.all([
        this.loadSearchIndex('/search/projects.json'),
        this.loadSearchIndex('/search/blog.json'),
        this.loadPagesData()
      ]);

      // Combine all search data based on category
      let searchData: any[] = [];
      
      if (category === 'all') {
        searchData = [
          ...projectsData.map((item: any) => ({ ...item, category: 'projects', type: 'project' })),
          ...blogData.map((item: any) => ({ ...item, category: 'blog', type: 'blog' })),
          ...pagesData.map((item: any) => ({ ...item, category: 'pages', type: 'page' }))
        ];
      } else if (category === 'projects') {
        searchData = projectsData.map((item: any) => ({ ...item, category: 'projects', type: 'project' }));
      } else if (category === 'blog') {
        searchData = blogData.map((item: any) => ({ ...item, category: 'blog', type: 'blog' }));
      } else if (category === 'pages') {
        searchData = pagesData.map((item: any) => ({ ...item, category: 'pages', type: 'page' }));
      }

  // Use Fuse.js for fuzzy search
  const fuse = new FuseCtor(searchData, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'description', weight: 0.3 },
          { name: 'tags', weight: 0.2 },
          { name: 'technologies', weight: 0.1 }
        ],
        threshold: 0.3, // Lower = more strict matching
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2
      });

      const fuseResults = fuse.search(query);
      
      // Convert Fuse results to SearchResult format
  const results: SearchResult[] = fuseResults.map((result: any) => ({
        title: result.item.title,
        description: result.item.description,
        url: this.getResultUrl(result.item),
        category: result.item.category,
        type: result.item.type,
        score: result.score,
        matches: result.matches
      }));

      return results.slice(0, 10); // Limit to top 10 results
    } catch (error) {
      const appError = createModuleError('SearchOverlay', 'FUZZY_SEARCH_ERROR', 
        `Fuzzy search failed: ${(error as Error)?.message || 'Unknown error'}`, {
          component: 'FuzzySearch',
          action: 'performFuzzySearch'
        });
      handleError(appError);
      throw error;
    }
  }

  private ensureFuse(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).Fuse) {
      return Promise.resolve((window as any).Fuse);
    }
    // Load vendored Fuse from local assets via LazyBundleLoader if present, otherwise inject script tag
    return new Promise((resolve, reject) => {
      try {
        const done = () => {
          if ((window as any).Fuse) resolve((window as any).Fuse);
          else reject(new Error('Fuse failed to initialize'));
        };
        if (typeof window !== 'undefined' && (window as any).LazyBundleLoader) {
          (window as any).LazyBundleLoader.loadBundle('fuse').then(done).catch(reject);
        } else {
          const s = document.createElement('script');
          s.src = '/assets/js/fuse.min.js';
          s.async = true;
          s.onload = done;
          s.onerror = () => reject(new Error('Failed to load Fuse'));
          document.head.appendChild(s);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  private async loadSearchIndex(url: string): Promise<any[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      const appError = createModuleError('SearchOverlay', 'SEARCH_INDEX_LOAD_ERROR', 
        `Failed to load search index from ${url}: ${(error as Error)?.message || 'Unknown error'}`, {
          component: 'SearchIndexLoader',
          action: 'loadSearchIndex',
          additionalData: { url }
        });
      handleError(appError);
      return [];
    }
  }

  private async loadPagesData(): Promise<any[]> {
    // Static pages data for search
    return [
      {
        title: 'About Blake Oxford',
        description: 'Learn about Blake Oxford\'s background in systems architecture, digital transformation, and technology leadership.',
        slug: 'about',
        tags: ['about', 'biography', 'experience', 'leadership', 'technology']
      },
      {
        title: 'Contact',
        description: 'Get in touch with Blake Oxford for collaboration, consulting, or project discussions.',
        slug: 'contact',
        tags: ['contact', 'collaboration', 'consulting', 'projects', 'email']
      },
      {
        title: 'Projects',
        description: 'Explore Blake Oxford\'s portfolio of technology projects, implementations, and digital transformations.',
        slug: 'projects',
        tags: ['projects', 'portfolio', 'technology', 'implementations', 'case studies']
      },
      {
        title: 'Blog',
        description: 'Read insights about systems architecture, digital transformation, and the latest in technology.',
        slug: 'blog',
        tags: ['blog', 'insights', 'architecture', 'transformation', 'technology']
      }
    ];
  }

  private getResultUrl(item: any): string {
    if (item.type === 'project') {
      return `/projects/${item.slug}`;
    } else if (item.type === 'blog') {
      return `/blog/${item.slug}`;
    } else if (item.type === 'page') {
      return `/${item.slug}`;
    }
    return '/';
  }
  
  displayResults(results: SearchResult[], query: string) {
    if (!this.searchResults) return;
    
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-no-results">
          <div class="search-no-results-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-8 h-8 text-gray-400 dark:text-gray-500">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3>No results found for "${query}"</h3>
          <p>Try different keywords or browse categories</p>
        </div>
      `;
    } else {
      this.searchResults.innerHTML = `
        <div class="search-results-container">
          ${results.map((result, index) => `
            <div class="search-result-item" role="option" tabindex="0" data-url="${result.url}" data-index="${index}">
              <div class="search-result-icon">
                ${this.getResultIconSvg(result.type)}
              </div>
              <div class="search-result-content">
                <h3 class="search-result-title">${this.highlightMatches(result.title, query)}</h3>
                <p class="search-result-description">${this.highlightMatches(result.description, query)}</p>
                <div class="search-result-meta">
                  <span class="search-result-category">${this.getCategoryDisplayName(result.category)}</span>
                  ${result.score ? `<span class="search-result-score">${Math.round((1 - result.score) * 100)}% match</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Add click handlers for search results
      this.addResultClickHandlers();
    }
    
    this.searchResults.classList.remove('hidden');
    this.searchResults.classList.add('active');
  }

  private getResultIcon(type: string): string {
    switch (type) {
      case 'project': return '📁';
      case 'blog': return '📝';
      case 'page': return '📄';
      default: return '📄';
    }
  }

  private getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'projects': return 'Project';
      case 'blog': return 'Blog Post';
      case 'pages': return 'Page';
      default: return category;
    }
  }

  private getResultIconSvg(type: string): string {
    switch (type) {
      case 'project':
        return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>`;
      case 'blog':
        return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>`;
      case 'page':
        return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>`;
      default:
        return `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>`;
    }
  }

  private highlightMatches(text: string, query: string): string {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private addResultClickHandlers() {
    if (!this.searchResults) return;
    
    const resultItems = this.searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const url = (item as HTMLElement).dataset.url;
        if (url) {
          this.navigateToResult(url);
        }
      });
    });
  }

  private navigateToResult(url: string) {
    // Track analytics
    this.trackSearchInteraction('result_clicked', { url });
    
    // Close search overlay
    this.closeSearchOverlay();
    
    // Navigate to result
    window.location.href = url;
  }

  private trackSearchInteraction(action: string, data: any = {}) {
    // Analytics tracking for search interactions
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(`search_${action}`, data);
    }
    console.log(`[Search Analytics] search_${action}`, data);
  }
  
  showSearchSuggestions() {
    if (!this.searchResults) return;
    
    const suggestions: SearchSuggestion[] = [
      { text: 'Search for "projects"', category: 'projects' },
      { text: 'Search for "blog posts"', category: 'blog' },
      { text: 'Search for "contact"', category: 'pages' }
    ];
    
    this.searchResults.innerHTML = `
      <div class="search-suggestions">
        <h3 class="search-suggestions-title">Search Suggestions</h3>
        <div class="search-suggestions-list">
          ${suggestions.map(suggestion => `
            <div class="search-suggestion-item" role="option" tabindex="0">
              <div class="search-result-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div class="search-result-content">
                <p class="search-suggestion-text">${suggestion.text}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    this.searchResults.classList.remove('hidden');
    this.searchResults.classList.add('active');
  }
  
  showLoadingState() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-loading">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
        <p class="text-sm font-medium">Searching...</p>
      </div>
    `;
    
    this.searchResults.classList.remove('hidden');
    this.searchResults.classList.add('active');
  }
  
  showErrorState() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-error">
        <div class="w-8 h-8 mx-auto mb-3 text-red-500 dark:text-red-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="font-medium text-red-600 dark:text-red-400">Search failed</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Please try again</p>
      </div>
    `;
    
    this.searchResults.classList.remove('hidden');
    this.searchResults.classList.add('active');
  }
  
  setupKeyboardNavigation() {
    if (!this.searchResults) return;
    
    this.searchResults.addEventListener('keydown', (e: KeyboardEvent) => {
      const items = this.searchResults?.querySelectorAll('.search-result-item');
      if (!items) return;
      const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
      
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          (items[nextIndex] as HTMLElement)?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          (items[prevIndex] as HTMLElement)?.focus();
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const activeItem = document.activeElement as HTMLElement;
          if (activeItem?.classList.contains('search-result-item')) {
            const url = activeItem.dataset.url;
            if (url) {
              this.navigateToResult(url);
            }
          }
          break;
        }
      }
    });
  }
  
  saveToSearchHistory(query: string) {
    if (!query) return;
    
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const newHistory = [query, ...history.filter((item: string) => item !== query)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      const appError = createModuleError('SearchOverlay', 'SEARCH_HISTORY_SAVE_ERROR', 
        `Failed to save search history: ${(error as Error)?.message || 'Unknown error'}`, {
          component: 'SearchHistory',
          action: 'save'
        });
      handleError(appError);
    }
  }
  
  loadSearchHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      if (history.length > 0) {
        // Could be used to show recent searches
        console.log('Search history loaded:', history);
      }
    } catch (error) {
      const appError = createModuleError('SearchOverlay', 'SEARCH_HISTORY_LOAD_ERROR', 
        `Failed to load search history: ${(error as Error)?.message || 'Unknown error'}`, {
          component: 'SearchHistory',
          action: 'load'
        });
      handleError(appError);
    }
  }
  
  closeSearchOverlay() {
    const searchOverlay = document.getElementById('search-overlay');
    if (!searchOverlay) return;

    // If already closing/closed, no-op (atomic guard)
    if (searchOverlay.dataset.__closing === 'true' || searchOverlay.dataset.state === 'closed') return;
    try { searchOverlay.dataset.__closing = 'true'; } catch (e) { /* noop */ }

    // Track analytics
    this.trackSearchInteraction('closed');

    // Stop voice recognition if active
    if (this.isListening && this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* noop */ }
    }

    // Close the overlay and update ARIA/state — ensure closed state wins
    try {
      searchOverlay.classList.remove('active');
      searchOverlay.dataset.state = 'closed';
      searchOverlay.setAttribute('aria-hidden', 'true');
      (searchOverlay as any).inert = true;

      // Force CSS-level hiding with inline styles and !important fallback via CSS rules
      searchOverlay.style.setProperty('opacity', '0');
      searchOverlay.style.setProperty('visibility', 'hidden');
      searchOverlay.style.setProperty('display', 'none');
    } catch (e) { /* noop */ }

    // Clear search input
    if (this.searchInput) {
      try { this.searchInput.value = ''; this.searchInput.setAttribute('aria-expanded', 'false'); } catch (e) { /* noop */ }
    }

    // Hide results
    if (this.searchResults) {
      try { this.searchResults.classList.remove('active'); this.searchResults.classList.add('hidden'); } catch (e) { /* noop */ }
    }

    // Restore body scroll only if mobile menu is not open
    try {
      const mobileMenu = document.getElementById('nav-mobile-links');
      if (!mobileMenu?.classList.contains('active')) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    } catch (e) { /* noop */ }

    // Focus back to search toggle (delay to let browser settle)
    const searchToggle = document.getElementById('search-toggle');
    setTimeout(() => {
      try { searchToggle?.focus(); } catch (e) { /* noop */ }
      try { delete (searchOverlay as any).dataset.__closing; } catch(e) { /* noop */ }
    }, 50);

    this.announceToScreenReader('Search overlay closed');
  }
  
  announceToScreenReader(message: string) {
    let liveRegion = document.getElementById('live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
    
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

export function initEnhancedSearchOverlay(): EnhancedSearchOverlay {
  console.log('🚀 Initializing EnhancedSearchOverlay...');
  return new EnhancedSearchOverlay();
}