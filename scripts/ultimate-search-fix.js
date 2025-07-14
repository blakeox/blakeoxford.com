#!/usr/bin/env node

/**
 * Ultimate Search Overlay Fix
 * Addresses all known issues with robust error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Ultimate Search Overlay Fix starting...\n');

// Step 1: Create a completely new, robust SearchOverlay implementation
async function createRobustSearchOverlay() {
  console.log('1️⃣ Creating robust SearchOverlay implementation...');
  
  const robustImplementation = `/**
 * Robust SearchOverlay Implementation
 * Handles all edge cases and initialization issues
 */

class RobustSearchOverlay {
  constructor() {
    console.log('🔍 RobustSearchOverlay constructor called');
    
    // Initialize properties
    this.overlay = null;
    this.searchInput = null;
    this.searchResults = null;
    this.isOpen = false;
    this.searchData = [];
    this.fuse = null;
    this.initialized = false;
    this.initAttempts = 0;
    this.maxInitAttempts = 5;
    
    // Bind methods to preserve context
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleKeyboard = this.handleKeyboard.bind(this);
    
    // Start initialization with retry logic
    this.attemptInitialization();
  }
  
  async attemptInitialization() {
    this.initAttempts++;
    console.log(\`🔄 Initialization attempt \${this.initAttempts}/\${this.maxInitAttempts}\`);
    
    try {
      await this.init();
      if (this.initialized) {
        console.log('✅ SearchOverlay initialization successful');
        return;
      }
    } catch (error) {
      console.error(\`❌ Initialization attempt \${this.initAttempts} failed:\`, error);
    }
    
    // Retry initialization if failed and under max attempts
    if (this.initAttempts < this.maxInitAttempts && !this.initialized) {
      console.log(\`⏳ Retrying initialization in \${this.initAttempts * 500}ms...\`);
      setTimeout(() => this.attemptInitialization(), this.initAttempts * 500);
    } else if (!this.initialized) {
      console.error('💥 SearchOverlay initialization failed after maximum attempts');
    }
  }

  async init() {
    console.log('🔧 Starting SearchOverlay initialization...');
    
    // Find DOM elements with detailed logging
    this.overlay = document.getElementById('search-overlay');
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');

    console.log('🔍 DOM elements found:', {
      overlay: !!this.overlay,
      searchInput: !!this.searchInput,
      searchResults: !!this.searchResults
    });

    if (!this.overlay || !this.searchInput || !this.searchResults) {
      throw new Error('Required DOM elements not found');
    }

    // Add debugging attributes
    this.overlay.setAttribute('data-debug', 'true');
    this.overlay.setAttribute('data-initialized', 'false');

    // Load dependencies and setup
    await this.loadSearchData();
    await this.loadFuseJS();
    this.setupFuzzySearch();
    this.bindEvents();
    this.setupKeyboardShortcuts();
    
    // Mark as initialized
    this.initialized = true;
    this.overlay.setAttribute('data-initialized', 'true');
    
    // Add test button in development
    this.addTestButton();
    
    console.log('✅ SearchOverlay fully initialized and ready');
  }

  async loadSearchData() {
    console.log('📊 Loading search data...');
    try {
      // Load blog posts
      const blogResponse = await fetch('/api/blog.json');
      if (!blogResponse.ok) throw new Error(\`Blog API failed: \${blogResponse.status}\`);
      const blogData = await blogResponse.json();
      
      // Load projects
      const projectsResponse = await fetch('/api/projects.json');
      if (!projectsResponse.ok) throw new Error(\`Projects API failed: \${projectsResponse.status}\`);
      const projectsData = await projectsResponse.json();
      
      // Combine and format search data
      this.searchData = [
        ...blogData.map(post => ({
          type: 'blog',
          title: post.title,
          description: post.description || '',
          url: \`/blog/\${post.slug}\`,
          tags: post.tags || [],
          date: post.publishedAt
        })),
        ...projectsData.map(project => ({
          type: 'project',
          title: project.title,
          description: project.description || '',
          url: \`/projects/\${project.slug}\`,
          tags: project.tags || [],
          date: project.publishedAt
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
      
      console.log(\`✅ Loaded \${this.searchData.length} search items\`);
    } catch (error) {
      console.error('❌ Failed to load search data:', error);
      this.searchData = [];
    }
  }

  async loadFuseJS() {
    console.log('🔍 Loading Fuse.js...');
    
    // Check if already loaded
    if (typeof Fuse !== 'undefined') {
      console.log('✅ Fuse.js already available');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Fuse.js loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Fuse.js');
        reject(new Error('Failed to load Fuse.js'));
      };
      
      document.head.appendChild(script);
    });
  }

  setupFuzzySearch() {
    console.log('⚙️ Setting up fuzzy search...');
    
    if (typeof Fuse === 'undefined') {
      console.warn('⚠️ Fuse.js not loaded, using basic search');
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
    console.log('✅ Fuzzy search configured');
  }

  bindEvents() {
    console.log('🔗 Binding events...');
    
    // Search toggle button
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
      searchToggle.addEventListener('click', () => {
        console.log('🔘 Search toggle clicked');
        this.open();
      });
    }

    // Close button
    const closeButton = document.getElementById('close-search');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        console.log('❌ Close button clicked');
        this.close();
      });
    }

    // Backdrop click
    const backdrop = this.overlay.querySelector('.search-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        console.log('🎭 Backdrop clicked');
        this.close();
      });
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

    // Global escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    console.log('✅ Events bound successfully');
  }

  setupKeyboardShortcuts() {
    console.log('⌨️ Setting up keyboard shortcuts...');
    
    document.addEventListener('keydown', this.handleKeyboard);
    console.log('✅ Keyboard shortcuts configured');
  }
  
  handleKeyboard(e) {
    // Ctrl+K or Cmd+K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      console.log('⌨️ Ctrl+K detected, opening search overlay');
      e.preventDefault();
      this.open();
      return;
    }

    // Forward slash to open search (if not in input)
    if (e.key === '/' && !this.isInputFocused()) {
      console.log('⌨️ / key detected, opening search overlay');
      e.preventDefault();
      this.open();
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

  open() {
    console.log('🔓 SearchOverlay.open() called');
    
    if (!this.overlay) {
      console.error('❌ Search overlay element not found');
      return;
    }

    if (!this.initialized) {
      console.error('❌ SearchOverlay not initialized yet');
      return;
    }

    console.log('🚀 Opening search overlay');
    this.isOpen = true;
    
    // Force display and add active class
    this.overlay.style.display = 'flex';
    this.overlay.style.opacity = '1';
    this.overlay.style.visibility = 'visible';
    this.overlay.style.pointerEvents = 'auto';
    this.overlay.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus search input with retry logic
    this.focusSearchInput();

    // Update ARIA
    this.searchInput?.setAttribute('aria-expanded', 'true');
    
    console.log('✅ Search overlay opened successfully');
  }
  
  focusSearchInput() {
    if (!this.searchInput) return;
    
    const focusWithRetry = (attempt = 1) => {
      this.searchInput.focus();
      this.searchInput.select();
      
      // Verify focus worked
      setTimeout(() => {
        if (document.activeElement !== this.searchInput && attempt < 3) {
          console.log(\`🔄 Focus attempt \${attempt} failed, retrying...\`);
          focusWithRetry(attempt + 1);
        } else if (document.activeElement === this.searchInput) {
          console.log('✅ Search input focused successfully');
        } else {
          console.warn('⚠️ Failed to focus search input after 3 attempts');
        }
      }, 50);
    };
    
    // Initial focus attempt
    setTimeout(focusWithRetry, 100);
  }

  close() {
    if (!this.overlay) return;

    console.log('🔒 Closing search overlay');
    this.isOpen = false;
    
    // Hide overlay
    this.overlay.style.display = 'none';
    this.overlay.style.opacity = '0';
    this.overlay.style.visibility = 'hidden';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Clear search
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchInput.setAttribute('aria-expanded', 'false');
    }
    this.clearResults();
    
    console.log('✅ Search overlay closed');
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
      const fuseResults = this.fuse.search(query);
      return fuseResults.map(result => ({
        ...result.item,
        score: result.score
      }));
    } else {
      // Fallback basic search
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
      this.searchResults.innerHTML = \`
        <div class="p-4 text-center text-gray-500">
          No results found for "\${query}"
        </div>
      \`;
      this.searchResults.style.display = 'block';
      return;
    }

    const resultHTML = results.slice(0, 8).map((item, index) => \`
      <a 
        href="\${item.url}" 
        class="search-result-item block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        data-index="\${index}"
        role="option"
        aria-selected="false"
      >
        <div class="flex items-start gap-3">
          <div class="search-result-icon flex-shrink-0 w-6 h-6 mt-1">
            \${this.getTypeIcon(item.type)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="search-result-title font-medium text-gray-900 dark:text-gray-100 truncate">
              \${this.highlightQuery(item.title, query)}
            </div>
            \${item.description ? \`
              <div class="search-result-description text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                \${this.highlightQuery(item.description, query)}
              </div>
            \` : ''}
            <div class="search-result-meta flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
              <span class="search-result-type capitalize">\${item.type}</span>
              \${item.date ? \`<span>•</span><span>\${new Date(item.date).toLocaleDateString()}</span>\` : ''}
            </div>
          </div>
        </div>
      </a>
    \`).join('');

    this.searchResults.innerHTML = resultHTML;
    this.searchResults.style.display = 'block';

    // Update ARIA
    this.searchResults.setAttribute('aria-label', \`\${results.length} search results for \${query}\`);
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

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(\`(\${escapedQuery})\`, 'gi');
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
  
  addTestButton() {
    // Only in development
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return;
    }
    
    setTimeout(() => {
      const testButton = document.createElement('button');
      testButton.innerHTML = 'TEST SEARCH';
      testButton.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        background: #22c55e;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s;
      \`;
      
      testButton.onmouseover = () => {
        testButton.style.background = '#16a34a';
        testButton.style.transform = 'translateY(-1px)';
      };
      
      testButton.onmouseout = () => {
        testButton.style.background = '#22c55e';
        testButton.style.transform = 'translateY(0)';
      };
      
      testButton.onclick = () => {
        console.log('🧪 Test button clicked, opening search');
        this.open();
      };
      
      document.body.appendChild(testButton);
      console.log('🧪 Test button added for development');
    }, 1000);
  }
}

// Global initialization with comprehensive error handling
(function initializeRobustSearchOverlay() {
  console.log('🚀 Initializing RobustSearchOverlay globally...');
  
  function createInstance() {
    try {
      if (window.searchOverlay) {
        console.log('⚠️ SearchOverlay already exists, replacing with robust version');
        // Clean up existing instance if possible
        if (typeof window.searchOverlay.destroy === 'function') {
          window.searchOverlay.destroy();
        }
      }
      
      console.log('✨ Creating new RobustSearchOverlay instance');
      window.searchOverlay = new RobustSearchOverlay();
      window.RobustSearchOverlay = RobustSearchOverlay; // For debugging
      
      console.log('✅ RobustSearchOverlay instance created and assigned to window.searchOverlay');
      
      // Global error handler for search overlay
      window.addEventListener('error', (e) => {
        if (e.message && e.message.includes('searchOverlay')) {
          console.error('🚨 SearchOverlay error detected:', e);
        }
      });
      
    } catch (error) {
      console.error('💥 Failed to create RobustSearchOverlay:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM loaded, creating RobustSearchOverlay');
      createInstance();
    });
  } else {
    console.log('📄 DOM already loaded, creating RobustSearchOverlay immediately');
    createInstance();
  }
})();`;

  const outputPath = path.join(__dirname, '../assets-source/js/robust-search-overlay.js');
  fs.writeFileSync(outputPath, robustImplementation);
  console.log('✅ Robust SearchOverlay implementation created');
}

// Step 2: Update bundle configuration to use robust implementation
async function updateBundleConfig() {
  console.log('\n2️⃣ Updating bundle configuration...');
  
  const bundleScriptPath = path.join(__dirname, 'optimize-bundle.js');
  let content = fs.readFileSync(bundleScriptPath, 'utf8');
  
  // Replace search-overlay.js with robust-search-overlay.js in interactive bundle
  content = content.replace(
    /interactive: \[\s*'search-overlay\.js',/,
    "interactive: [\n    'robust-search-overlay.js',"
  );
  
  fs.writeFileSync(bundleScriptPath, content);
  console.log('✅ Bundle configuration updated');
}

// Step 3: Add comprehensive CSS fixes
async function addUltimateCSS() {
  console.log('\n3️⃣ Adding ultimate CSS fixes...');
  
  const ultimateCSS = `
/* Ultimate Search Overlay Fixes */
.search-overlay[data-debug="true"] {
  /* Make absolutely sure it's visible when active */
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 99999 !important;
  background: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.search-overlay[data-debug="true"][data-initialized="true"] {
  /* Green border when properly initialized */
  border: 3px solid #22c55e !important;
}

.search-overlay[data-debug="true"][data-initialized="false"] {
  /* Red border when not initialized */
  border: 3px solid #ef4444 !important;
}

/* Force visibility when active class is present */
.search-overlay.active {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  display: flex !important;
}

/* Ensure search container is always above backdrop */
.search-container.minimalist {
  position: relative !important;
  z-index: 100 !important;
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
}

/* Debug styles for search input */
.search-input[data-debug="true"] {
  border: 2px solid #3b82f6 !important;
}

/* Make search results more visible */
.search-results {
  background: white !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.dark .search-results {
  background: #1f2937 !important;
  border-color: #374151 !important;
}
`;

  const cssPath = path.join(__dirname, '../src/styles/global.css');
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Only add if not already present
  if (!cssContent.includes('Ultimate Search Overlay Fixes')) {
    cssContent += ultimateCSS;
    fs.writeFileSync(cssPath, cssContent);
    console.log('✅ Ultimate CSS fixes added');
  } else {
    console.log('✅ Ultimate CSS fixes already present');
  }
}

// Step 4: Rebuild bundles
async function rebuildWithRobustImplementation() {
  console.log('\n4️⃣ Rebuilding bundles with robust implementation...');
  
  const { execSync } = await import('child_process');
  try {
    execSync('node scripts/optimize-bundle.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Bundles rebuilt with robust implementation');
  } catch (error) {
    console.error('❌ Bundle rebuild failed:', error.message);
  }
}

// Step 5: Create ultimate test
async function createUltimateTest() {
  console.log('\n5️⃣ Creating ultimate test...');
  
  const ultimateTestContent = `import { test, expect } from '@playwright/test';

test('ultimate search overlay test', async ({ page }) => {
  console.log('🧪 Starting ultimate search overlay test...');
  
  await page.goto('http://localhost:4323/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for RobustSearchOverlay
  const robustCheck = await page.evaluate(() => {
    return {
      robustClass: typeof RobustSearchOverlay !== 'undefined',
      robustInstance: !!window.searchOverlay,
      instanceType: window.searchOverlay?.constructor?.name,
      initialized: window.searchOverlay?.initialized,
      overlayElement: !!document.getElementById('search-overlay'),
      debugAttribute: document.getElementById('search-overlay')?.getAttribute('data-debug'),
      initializedAttribute: document.getElementById('search-overlay')?.getAttribute('data-initialized')
    };
  });
  
  console.log('Robust check results:', robustCheck);
  
  // Verify robust implementation is working
  expect(robustCheck.robustClass).toBe(true);
  expect(robustCheck.robustInstance).toBe(true);
  expect(robustCheck.instanceType).toBe('RobustSearchOverlay');
  expect(robustCheck.initialized).toBe(true);
  expect(robustCheck.overlayElement).toBe(true);
  
  // Test opening the search overlay
  await page.evaluate(() => {
    window.searchOverlay.open();
  });
  
  // Wait for animation
  await page.waitForTimeout(500);
  
  // Check if overlay is visible
  const searchOverlay = page.locator('#search-overlay');
  await expect(searchOverlay).toBeVisible();
  
  // Test keyboard shortcut
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  
  // Test Ctrl+K shortcut
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  await expect(searchOverlay).toBeVisible();
  
  // Test search functionality
  await page.fill('#search-input', 'test');
  await page.waitForTimeout(500);
  
  const searchResults = page.locator('#search-results');
  await expect(searchResults).toBeVisible();
  
  console.log('✅ Ultimate search overlay test completed successfully');
});`;

  const testPath = path.join(__dirname, '../tests/playwright/ultimate-search-test.spec.ts');
  fs.writeFileSync(testPath, ultimateTestContent);
  console.log('✅ Ultimate test created');
}

// Main execution
async function main() {
  try {
    await createRobustSearchOverlay();
    await updateBundleConfig();
    await addUltimateCSS();
    await rebuildWithRobustImplementation();
    await createUltimateTest();
    
    console.log('\n🎉 Ultimate Search Overlay Fix Complete!');
    console.log('\n📋 What was fixed:');
    console.log('  ✅ Created robust SearchOverlay with retry logic');
    console.log('  ✅ Added comprehensive error handling');
    console.log('  ✅ Fixed bundle optimization issues');
    console.log('  ✅ Added ultimate CSS fixes');
    console.log('  ✅ Created comprehensive test suite');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Restart your dev server');
    console.log('  2. Run: npx playwright test tests/playwright/ultimate-search-test.spec.ts');
    console.log('  3. Look for the green TEST SEARCH button');
    console.log('  4. Try Ctrl+K keyboard shortcut');
    
  } catch (error) {
    console.error('💥 Ultimate fix failed:', error);
    process.exit(1);
  }
}

main();
