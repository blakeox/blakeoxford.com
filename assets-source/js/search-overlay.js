/**
 * Search Overlay Implementation
 * Provides fuzzy search functionality with keyboard shortcuts
 */

class SearchOverlay {
  constructor() {
    this.overlay = null;
    this.searchInput = null;
    this.searchResults = null;
    this.isOpen = false;
    this.searchData = [];
    this.fuse = null;
    
    this.init();
  }

  async init() {
    this.overlay = document.getElementById('search-overlay');
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    
    if (!this.overlay || !this.searchInput || !this.searchResults) {
      console.warn('Search overlay elements not found');
      return;
    }

    await this.loadSearchData();
    this.setupFuzzySearch();
    this.bindEvents();
    this.setupKeyboardShortcuts();
  }

  async loadSearchData() {
    try {
      // Load blog posts
      const blogResponse = await fetch('/api/blog.json');
      const blogData = await blogResponse.json();
      
      // Load projects
      const projectsResponse = await fetch('/api/projects.json');
      const projectsData = await projectsResponse.json();
      
      // Combine and format search data
      this.searchData = [
        ...blogData.map(post => ({
          type: 'blog',
          title: post.title,
          description: post.description || '',
          url: `/blog/${post.slug}`,
          tags: post.tags || [],
          date: post.publishedAt
        })),
        ...projectsData.map(project => ({
          type: 'project',
          title: project.title,
          description: project.description || '',
          url: `/projects/${project.slug}`,
          tags: project.tags || [],
          date: project.date
        })),
        // Add static pages
        {
          type: 'page',
          title: 'About',
          description: 'Learn about Blake Oxford, Systems Architect and Developer',
          url: '/about',
          tags: ['about', 'bio', 'experience'],
          date: null
        },
        {
          type: 'page',
          title: 'Contact',
          description: 'Get in touch with Blake Oxford',
          url: '/contact',
          tags: ['contact', 'email', 'message'],
          date: null
        }
      ];
    } catch (error) {
      console.error('Failed to load search data:', error);
      this.searchData = [];
    }
  }

  setupFuzzySearch() {
    if (typeof Fuse === 'undefined') {
      console.warn('Fuse.js not loaded, using basic search');
      return;
    }

    const options = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'tags', weight: 0.3 }
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      minMatchCharLength: 2
    };

    this.fuse = new Fuse(this.searchData, options);
  }

  bindEvents() {
    // Search toggle button
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
      searchToggle.addEventListener('click', () => this.open());
    }

    // Close button
    const closeButton = document.getElementById('close-search');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }

    // Backdrop click
    const backdrop = this.overlay.querySelector('.search-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });

      this.searchInput.addEventListener('keydown', (e) => {
        this.handleKeyNavigation(e);
      });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }

      // Forward slash to open search (if not in input)
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        this.open();
      }
    });
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.contentEditable === 'true'
    );
  }

  open() {
    if (!this.overlay) return;

    this.isOpen = true;
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus search input after animation with WebKit compatibility
    const focusInput = () => {
      if (this.searchInput) {
        this.searchInput.focus();
        this.searchInput.select();
        
        // Double-check focus worked (WebKit workaround)
        setTimeout(() => {
          if (document.activeElement !== this.searchInput) {
            this.searchInput.focus();
          }
        }, 50);
      }
    };
    
    setTimeout(focusInput, 100);
    
    // Additional focus attempt for WebKit
    setTimeout(focusInput, 300);

    // Update ARIA
    this.searchInput?.setAttribute('aria-expanded', 'true');
  }

  close() {
    if (!this.overlay) return;

    this.isOpen = false;
    this.overlay.style.display = 'none';
    document.body.style.overflow = '';
    
    // Clear search
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchInput.setAttribute('aria-expanded', 'false');
    }
    this.clearResults();
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.clearResults();
      return;
    }

    const results = this.performSearch(query);
    this.displayResults(results, query);
  }

  performSearch(query) {
    if (this.fuse) {
      // Use Fuse.js for fuzzy search
      const fuseResults = this.fuse.search(query);
      return fuseResults.map(result => ({
        ...result.item,
        score: result.score
      }));
    } else {
      // Fallback to basic search
      const lowerQuery = query.toLowerCase();
      return this.searchData.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
  }

  displayResults(results, query) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          No results found for "${query}"
        </div>
      `;
      this.searchResults.style.display = 'block';
      return;
    }

    const resultHTML = results.slice(0, 8).map((item, index) => `
      <a 
        href="${item.url}" 
        class="search-result-item block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        data-index="${index}"
        role="option"
        aria-selected="false"
      >
        <div class="flex items-start gap-3">
          <div class="search-result-icon flex-shrink-0 w-6 h-6 mt-1">
            ${this.getTypeIcon(item.type)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="search-result-title font-medium text-gray-900 dark:text-gray-100 truncate">
              ${this.highlightQuery(item.title, query)}
            </div>
            ${item.description ? `
              <div class="search-result-description text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                ${this.highlightQuery(item.description, query)}
              </div>
            ` : ''}
            <div class="search-result-meta flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
              <span class="search-result-type capitalize">${item.type}</span>
              ${item.date ? `<span>•</span><span>${new Date(item.date).toLocaleDateString()}</span>` : ''}
            </div>
          </div>
        </div>
      </a>
    `).join('');

    this.searchResults.innerHTML = resultHTML;
    this.searchResults.style.display = 'block';

    // Update ARIA
    this.searchResults.setAttribute('aria-label', `${results.length} search results for ${query}`);
  }

  getTypeIcon(type) {
    const icons = {
      blog: '<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
      project: '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/></svg>',
      page: '<svg class="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>'
    };
    return icons[type] || icons.page;
  }

  highlightQuery(text, query) {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  }

  handleKeyNavigation(e) {
    const results = this.searchResults?.querySelectorAll('.search-result-item');
    if (!results || results.length === 0) return;

    const currentSelected = this.searchResults.querySelector('[aria-selected="true"]');
    let currentIndex = currentSelected ? parseInt(currentSelected.dataset.index) : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, results.length - 1);
        this.updateSelection(results, currentIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        this.updateSelection(results, currentIndex);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentSelected) {
          currentSelected.click();
        }
        break;
    }
  }

  updateSelection(results, index) {
    // Clear previous selection
    results.forEach(result => result.setAttribute('aria-selected', 'false'));
    
    // Set new selection
    if (results[index]) {
      results[index].setAttribute('aria-selected', 'true');
      results[index].scrollIntoView({ block: 'nearest' });
    }
  }

  clearResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '';
      this.searchResults.style.display = 'none';
    }
  }
}

// Initialize search overlay when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.searchOverlay = new SearchOverlay();
  });
} else {
  window.searchOverlay = new SearchOverlay();
}
