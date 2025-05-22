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
    this.searchOverlay.classList.remove('hidden');
    
    // Trigger animation
    requestAnimationFrame(() => {
      this.searchOverlay.classList.add('active');
    });
    
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
    
    // Hide overlay after animation
    setTimeout(() => {
      this.searchOverlay.classList.add('hidden');
    }, 300);
    
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
        
        // Calculate fuzzy match score
        searchTerms.forEach(term => {
          if (title.includes(term)) {
            score += 50;
          }
          if (excerpt.includes(term)) {
            score += 25;
          }
          
          // Bonus for word start matches
          if (title.split(' ').some(word => word.startsWith(term))) {
            score += 30;
          }
        });
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit to 8 results
  }

  renderResults(results) {
    if (!this.searchResults) return;
    
    if (results.length === 0) {
      this.showNoResults();
      return;
    }
    
    const resultsHTML = results.map((result, index) => {
      const iconHTML = this.getIconHTML(result.icon);
      const typeLabel = this.getTypeLabel(result.type);
      
      return `
        <a href="${result.url}" class="search-result-item" data-index="${index}">
          <div class="search-result-icon">
            ${iconHTML}
          </div>
          <div class="search-result-content">
            <div class="search-result-type">${typeLabel}</div>
            <h3 class="search-result-title">${this.highlightMatch(result.title)}</h3>
            <p class="search-result-excerpt">${this.highlightMatch(result.excerpt || '')}</p>
          </div>
        </a>
      `;
    }).join('');
    
    this.searchResults.innerHTML = resultsHTML;
    
    // Add click listeners to results
    this.setupResultListeners();
  }

  getIconHTML(iconType) {
    const icons = {
      article: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      folder: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>',
      person: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>',
      mail: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>'
    };
    
    return icons[iconType] || icons.article;
  }

  getTypeLabel(type) {
    const labels = {
      blog: 'Blog Post',
      project: 'Project',
      page: 'Page'
    };
    
    return labels[type] || 'Content';
  }

  highlightMatch(text) {
    if (!this.searchInput || !text) return text;
    
    const query = this.searchInput.value.trim();
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  setupResultListeners() {
    const resultItems = this.searchResults.querySelectorAll('.search-result-item');
    
    resultItems.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        this.trackEvent('search_result_clicked', {
          position: index,
          url: item.href,
          title: this.currentResults[index]?.title
        });
      });
      
      item.addEventListener('mouseenter', () => {
        this.setSelectedIndex(index);
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
    const maxIndex = this.currentResults.length - 1;
    
    if (direction > 0) {
      this.selectedIndex = this.selectedIndex < maxIndex ? this.selectedIndex + 1 : 0;
    } else {
      this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : maxIndex;
    }
    
    this.updateSelectionDisplay();
  }

  setSelectedIndex(index) {
    this.selectedIndex = index;
    this.updateSelectionDisplay();
  }

  updateSelectionDisplay() {
    const resultItems = this.searchResults.querySelectorAll('.search-result-item');
    
    resultItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('highlighted');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('highlighted');
      }
    });
  }

  selectResult() {
    if (this.selectedIndex >= 0 && this.currentResults[this.selectedIndex]) {
      const result = this.currentResults[this.selectedIndex];
      
      this.trackEvent('search_result_selected', {
        position: this.selectedIndex,
        url: result.url,
        title: result.title,
        method: 'keyboard'
      });
      
      window.location.href = result.url;
    }
  }

  showLoadingState() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-empty-state">
        <div class="search-loading">
          <div class="loading-spinner"></div>
        </div>
        <h3>Searching...</h3>
      </div>
    `;
  }

  showNoResults() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3>No results found</h3>
        <p>Try adjusting your search terms</p>
      </div>
    `;
  }

  clearResults() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3>Start typing to search</h3>
        <p>Search through blog posts, projects, and pages</p>
      </div>
    `;
    
    this.currentResults = [];
  }

  setupAccessibility() {
    if (this.searchOverlay) {
      this.searchOverlay.setAttribute('role', 'dialog');
      this.searchOverlay.setAttribute('aria-modal', 'true');
      this.searchOverlay.setAttribute('aria-label', 'Search');
    }
    
    if (this.searchResults) {
      this.searchResults.setAttribute('role', 'listbox');
      this.searchResults.setAttribute('aria-label', 'Search results');
    }
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }

  trackEvent(eventName, eventData = {}) {
    // Support multiple analytics providers
    if (typeof gtag === 'function') {
      gtag('event', eventName, eventData);
    } else if (typeof plausible === 'function') {
      plausible(eventName, { props: eventData });
    } else if (typeof fathom === 'object' && typeof fathom.trackEvent === 'function') {
      fathom.trackEvent(eventName, eventData);
    } else {
      console.debug('[Search Analytics]', eventName, eventData);
    }
  }

  // Public API
  refresh() {
    this.loadSearchIndex();
  }

  destroy() {
    // Clean up event listeners
    document.body.style.overflow = '';
    clearTimeout(this.searchTimeout);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.searchOverlayEnhancer = new SearchOverlayEnhancer();
  });
} else {
  window.searchOverlayEnhancer = new SearchOverlayEnhancer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchOverlayEnhancer;
}
