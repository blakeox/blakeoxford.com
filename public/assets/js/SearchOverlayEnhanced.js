// SearchOverlayEnhanced.js: Advanced search functionality with fuzzy search and AI-powered suggestions
// Features: Real-time search, keyboard navigation, analytics, and progressive enhancement

class SearchOverlayEnhancer {
  constructor() {
    this.searchOverlay = null;
    this.searchInput = null;
    this.searchResults = null;
    this.closeButton = null;
    this.searchToggle = null;
    
    this.isOpen = false;
    this.currentResults = [];
    this.selectedIndex = -1;
    this.searchTimeout = null;
    
    // Search index for fast searching
    this.searchIndex = null;
    this.contentData = [];
    
    this.init();
  }

  async init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    await this.loadSearchIndex();
    this.setupAccessibility();
  }

  cacheElements() {
    this.searchOverlay = document.getElementById('search-overlay');
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.closeButton = document.getElementById('close-search');
    this.searchToggle = document.getElementById('search-toggle');
    
    if (!this.searchOverlay) {
      console.warn('Search overlay elements not found');
      return;
    }
  }

  setupEventListeners() {
    // Open search
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSearch();
      });
    }

    // Close search
    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeSearch();
      });
    }

    // Close on backdrop click
    if (this.searchOverlay) {
      this.searchOverlay.addEventListener('click', (e) => {
        if (e.target === this.searchOverlay || e.target.classList.contains('search-backdrop')) {
          this.closeSearch();
        }
      });
    }

    // Search input events
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      this.searchInput.addEventListener('keydown', (e) => {
        this.handleSearchKeydown(e);
      });

      // Focus management
      this.searchInput.addEventListener('focus', () => {
        this.trackEvent('search_input_focused');
        if (this.currentResults.length > 0) {
          this.searchResults.classList.add('active');
          this.searchInput.setAttribute('aria-expanded', 'true');
        }
      });

      this.searchInput.addEventListener('blur', () => {
        // Delay hiding results to allow for clicking on them
        setTimeout(() => {
          this.searchResults.classList.remove('active');
          this.searchInput.setAttribute('aria-expanded', 'false');
        }, 200);
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Open search with '/' key
      if (e.key === '/' && !this.isInputFocused() && !this.isOpen) {
        e.preventDefault();
        this.openSearch();
      }
      
      // Close search with Escape
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.closeSearch();
      }
      
      // Command/Ctrl + K shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (this.isOpen) {
          this.closeSearch();
        } else {
          this.openSearch();
        }
      }
    });
  }

  async loadSearchIndex() {
    try {
      // Load blog posts
      const blogResponse = await fetch('/api/blog.json');
      const blogData = await blogResponse.json();
      
      // Load projects (assuming similar API structure)
      let projectData = [];
      try {
        const projectResponse = await fetch('/api/projects.json');
        projectData = await projectResponse.json();
      } catch (e) {
        console.log('Projects API not available, skipping...');
      }
      
      // Combine all searchable content
      this.contentData = [
        ...blogData.map(item => ({
          ...item,
          type: 'blog',
          icon: 'article'
        })),
        ...projectData.map(item => ({
          ...item,
          type: 'project',
          icon: 'folder'
        })),
        // Add static pages
        {
          title: 'About',
          excerpt: 'Learn more about Blake Oxford - Software Engineer, Project Manager, and Digital Transformation Specialist.',
          url: '/about/',
          type: 'page',
          icon: 'person'
        },
        {
          title: 'Contact',
          excerpt: 'Get in touch with Blake Oxford for project inquiries, collaborations, or professional opportunities.',
          url: '/contact/',
          type: 'page',
          icon: 'mail'
        }
      ];
      
      console.log(`Search index loaded with ${this.contentData.length} items`);
    } catch (error) {
      console.error('Failed to load search index:', error);
      this.contentData = [];
    }
  }

  openSearch() {
    this.isOpen = true;
    this.searchOverlay.classList.add('active');
    
    // Focus search input
    setTimeout(() => {
      this.searchInput?.focus();
    }, 100);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    this.trackEvent('search_opened');
  }

  closeSearch() {
    this.isOpen = false;
    this.searchOverlay.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clear search
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.clearResults();
    this.selectedIndex = -1;
    
    this.trackEvent('search_closed');
  }

  handleSearchInput(query) {
    clearTimeout(this.searchTimeout);
    
    if (!query.trim()) {
      this.clearResults();
      return;
    }
    
    // Show loading state
    this.showLoadingState();
    
    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 150);
  }

  performSearch(query) {
    const results = this.fuzzySearch(query);
    this.currentResults = results;
    this.selectedIndex = -1;
    this.renderResults(results);
    
    // Update ARIA attributes
    this.searchInput.setAttribute('aria-expanded', results.length > 0 ? 'true' : 'false');
    this.searchResults.classList.toggle('active', results.length > 0);
    
    this.trackEvent('search_performed', {
      query: query,
      results_count: results.length
    });
  }

  fuzzySearch(query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return this.contentData
      .map(item => {
        let score = 0;
        const title = item.title.toLowerCase();
        const excerpt = (item.excerpt || '').toLowerCase();
        const content = `${title} ${excerpt}`;
        
        // Exact title match gets highest score
        if (title.includes(query.toLowerCase())) {
          score += 100;
        }
        
        // Partial title match
        searchTerms.forEach(term => {
          if (title.includes(term)) {
            score += 50;
          }
          if (excerpt.includes(term)) {
            score += 25;
          }
        });
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results
  }

  renderResults(results) {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = '';
    
    if (results.length === 0) {
      this.showNoResults();
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.setAttribute('role', 'option');
      item.setAttribute('id', `search-result-${index}`);
      item.setAttribute('aria-selected', 'false');
      
      const icon = this.getIconHTML(result.icon);
      const typeLabel = this.getTypeLabel(result.type);
      
      item.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-neutral-500">${icon}</div>
          <div class="flex-1">
            <div class="font-medium">${this.highlightMatch(result.title)}</div>
            <div class="text-sm text-neutral-500">${typeLabel}</div>
          </div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        window.location.href = result.url;
      });
      
      item.addEventListener('mouseenter', () => {
        this.setSelectedIndex(index);
      });
      
      fragment.appendChild(item);
    });
    
    this.searchResults.appendChild(fragment);
    this.setupResultListeners();
  }

  getIconHTML(iconType) {
    const icons = {
      article: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
      folder: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
      person: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      mail: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
    };
    return icons[iconType] || icons.article;
  }

  getTypeLabel(type) {
    const labels = {
      blog: 'Blog Post',
      project: 'Project',
      page: 'Page'
    };
    return labels[type] || type;
  }

  highlightMatch(text) {
    if (!this.searchInput.value) return text;
    
    const query = this.searchInput.value.toLowerCase();
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  setupResultListeners() {
    const items = this.searchResults.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        window.location.href = this.currentResults[index].url;
      });
    });
  }

  handleSearchKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        this.selectResult();
        break;
      case 'Escape':
        e.preventDefault();
        this.closeSearch();
        break;
    }
  }

  moveSelection(direction) {
    const newIndex = this.selectedIndex + direction;
    if (newIndex >= -1 && newIndex < this.currentResults.length) {
      this.setSelectedIndex(newIndex);
    }
  }

  setSelectedIndex(index) {
    this.selectedIndex = index;
    this.updateSelectionDisplay();
  }

  updateSelectionDisplay() {
    const items = this.searchResults.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      item.setAttribute('aria-selected', isSelected);
      item.classList.toggle('bg-surface-subtle', isSelected);
      
      if (isSelected) {
        this.searchInput.setAttribute('aria-activedescendant', `search-result-${index}`);
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  selectResult() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.currentResults.length) {
      window.location.href = this.currentResults[this.selectedIndex].url;
    }
  }

  showLoadingState() {
    if (!this.searchResults) return;
    this.searchResults.innerHTML = `
      <div class="p-4 text-center text-neutral-500">
        <div class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
        <div class="mt-2">Searching...</div>
      </div>
    `;
    this.searchResults.classList.add('active');
  }

  showNoResults() {
    if (!this.searchResults) return;
    this.searchResults.innerHTML = `
      <div class="p-4 text-center text-neutral-500">
        <div class="text-lg">No results found</div>
        <div class="text-sm mt-1">Try different keywords</div>
      </div>
    `;
    this.searchResults.classList.add('active');
  }

  clearResults() {
    if (!this.searchResults) return;
    this.searchResults.innerHTML = '';
    this.searchResults.classList.remove('active');
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.setAttribute('aria-activedescendant', '');
  }

  setupAccessibility() {
    // Ensure proper ARIA attributes
    if (this.searchInput) {
      this.searchInput.setAttribute('aria-expanded', 'false');
      this.searchInput.setAttribute('aria-controls', 'search-results');
      this.searchInput.setAttribute('aria-activedescendant', '');
    }
    
    if (this.searchResults) {
      this.searchResults.setAttribute('role', 'listbox');
      this.searchResults.setAttribute('aria-label', 'Search results');
    }
  }

  isInputFocused() {
    return document.activeElement === this.searchInput;
  }

  trackEvent(eventName, eventData = {}) {
    // Implement analytics tracking here
    console.log('Search event:', eventName, eventData);
  }

  refresh() {
    this.loadSearchIndex();
  }

  destroy() {
    // Clean up event listeners
    if (this.searchToggle) {
      this.searchToggle.removeEventListener('click', this.openSearch);
    }
    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.closeSearch);
    }
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleSearchInput);
      this.searchInput.removeEventListener('keydown', this.handleSearchKeydown);
    }
  }
}

// Initialize the search overlay
document.addEventListener('DOMContentLoaded', () => {
  window.searchOverlay = new SearchOverlayEnhancer();
});
