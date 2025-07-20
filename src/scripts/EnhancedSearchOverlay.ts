/**
 * Enhanced search overlay with voice search, categories, and suggestions
 */

interface SearchResult {
  title: string;
  description: string;
  url: string;
  category: string;
  type: 'project' | 'blog';
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
  private recognition: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  
  init() {
    this.setupVoiceSearch();
    this.setupSearchInput();
    this.setupCategories();
    this.setupKeyboardNavigation();
    this.loadSearchHistory();
    
    console.log('✅ Enhanced SearchOverlay initialized');
  }
  
  setupVoiceSearch() {
    if (!this.voiceSearchBtn) return;
    
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.voiceSearchBtn?.classList.add('listening');
        this.voiceSearchBtn?.setAttribute('aria-label', 'Listening... Click to stop');
        this.announceToScreenReader('Voice search started. Please speak now.');
      };
      
      this.recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
      
      this.recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const errorEvent = event;
        console.error('Speech recognition error:', errorEvent.error);
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
      
      // Simulate search API call (replace with actual search logic)
      const results = await this.searchContent(query, this.currentCategory);
      
      this.displayResults(results, query);
      this.saveToSearchHistory(query);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showErrorState();
    }
  }
  
  async searchContent(query: string, category: string): Promise<SearchResult[]> {
    // Simulate search results (replace with actual search implementation)
    const mockResults: SearchResult[] = [
      {
        title: 'Sample Project',
        description: 'A sample project that matches your search',
        url: '/projects/sample',
        category: 'projects',
        type: 'project'
      },
      {
        title: 'Sample Blog Post',
        description: 'A blog post about interesting topics',
        url: '/blog/sample',
        category: 'blog',
        type: 'blog'
      }
    ];
    
    // Filter by category if not 'all'
    let filteredResults = mockResults;
    if (category !== 'all') {
      filteredResults = mockResults.filter(result => result.category === category);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return filteredResults;
  }
  
  displayResults(results: SearchResult[], query: string) {
    if (!this.searchResults) return;
    
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="p-4 text-center text-neutral dark:text-neutral-light">
          <p>No results found for "${query}"</p>
          <p class="mt-2 text-sm">Try different keywords or browse categories</p>
        </div>
      `;
    } else {
      this.searchResults.innerHTML = results.map(result => `
        <div class="search-result-item" role="option" tabindex="0">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <span class="text-accent text-xs md:text-sm">${result.type === 'project' ? '📁' : '📝'}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-foreground dark:text-foreground-light text-sm md:text-base">${result.title}</h3>
              <p class="text-xs md:text-sm text-neutral dark:text-neutral-light mt-1">${result.description}</p>
              <p class="text-xs text-accent mt-1">${result.category}</p>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    this.searchResults.classList.add('active');
  }
  
  showSearchSuggestions() {
    if (!this.searchResults) return;
    
    const suggestions: SearchSuggestion[] = [
      { text: 'Search for "projects"', category: 'projects' },
      { text: 'Search for "blog posts"', category: 'blog' },
      { text: 'Search for "contact"', category: 'pages' }
    ];
    
    this.searchResults.innerHTML = `
      <div class="p-4">
        <h3 class="font-medium text-foreground dark:text-foreground-light mb-3 text-sm md:text-base">Search Suggestions</h3>
        ${suggestions.map(suggestion => `
          <div class="search-result-item" role="option" tabindex="0">
            <div class="flex items-center gap-2">
              <span class="text-accent">💡</span>
              <span class="text-sm md:text-base">${suggestion.text}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    this.searchResults.classList.add('active');
  }
  
  showLoadingState() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="p-4 text-center">
        <div class="inline-block animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-accent"></div>
        <p class="mt-2 text-neutral dark:text-neutral-light text-sm md:text-base">Searching...</p>
      </div>
    `;
    
    this.searchResults.classList.add('active');
  }
  
  showErrorState() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="p-4 text-center text-red-600 dark:text-red-400">
        <p class="text-sm md:text-base">❌ Search failed</p>
        <p class="mt-1 text-xs md:text-sm">Please try again</p>
      </div>
    `;
    
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
            // Handle result selection
            console.log('Selected result:', activeItem.textContent);
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
      console.error('Failed to save search history:', error);
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
      console.error('Failed to load search history:', error);
    }
  }
  
  closeSearchOverlay() {
    const searchOverlay = document.getElementById('search-overlay');
    
    if (!searchOverlay) return;
    
    // Stop voice recognition if active
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }
    
    // Close the overlay
    searchOverlay.classList.remove('active');
    searchOverlay.style.visibility = 'hidden';
    searchOverlay.style.opacity = '0';
    
    // Clear search input
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    // Hide results
    if (this.searchResults) {
      this.searchResults.classList.remove('active');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Focus back to search toggle
    const searchToggle = document.getElementById('search-toggle');
    searchToggle?.focus();
    
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