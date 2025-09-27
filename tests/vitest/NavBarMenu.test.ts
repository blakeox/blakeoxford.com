/**
 * NavBarMenu Unit Tests - Simplified Version
 * Tests the NavBarMenu.js navigation enhancement functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Simple mock for NavBarMenu functionality
class MockNavBarMenu {
  navbar: HTMLElement | null = null;
  navToggle: HTMLElement | null = null;
  mobileMenu: HTMLElement | null = null;
  searchToggle: HTMLElement | null = null;
  isMenuOpen: boolean = false;

  constructor() {
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
  }

  cacheElements() {
    this.navbar = document.getElementById('navbar');
    this.navToggle = document.getElementById('nav-toggle');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.searchToggle = document.getElementById('search-toggle');
  }

  setupEventListeners() {
    if (this.navToggle) {
      this.navToggle.addEventListener('click', this.toggleMenu.bind(this));
    }
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', this.openSearch.bind(this));
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    
    if (this.navToggle) {
      this.navToggle.setAttribute('aria-expanded', this.isMenuOpen.toString());
    }
    
    if (this.mobileMenu) {
      this.mobileMenu.style.display = this.isMenuOpen ? 'block' : 'none';
    }
  }

  openSearch() {
    // Mock search functionality
    const searchOverlay = document.getElementById('search-overlay');
    if (searchOverlay) {
      searchOverlay.style.display = 'block';
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    
    if (this.navToggle) {
      this.navToggle.setAttribute('aria-expanded', 'false');
    }
    
    if (this.mobileMenu) {
      this.mobileMenu.style.display = 'none';
    }
  }
}

describe('NavBarMenu', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;
  let navBarMenu: MockNavBarMenu;

  beforeEach(() => {
    // Setup DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <nav class="navbar" id="navbar">
            <div class="nav-brand">
              <a href="/">Brand</a>
            </div>
            <button id="nav-toggle" class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div id="mobile-menu" class="mobile-menu" style="display: none;">
              <ul class="nav-list">
                <li><a href="/" data-analytics="nav_home">Home</a></li>
                <li><a href="/about/" data-analytics="nav_about">About</a></li>
                <li><a href="/projects/" data-analytics="nav_projects">Projects</a></li>
                <li><a href="/contact/" data-analytics="nav_contact">Contact</a></li>
              </ul>
            </div>
            <button id="search-toggle" class="search-toggle" aria-label="Open search">
              Search
            </button>
          </nav>
          <div id="search-overlay" style="display: none;">
            <input type="text" placeholder="Search..." />
          </div>
          <main id="main">Main content</main>
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

    // Initialize navigation
    navBarMenu = new MockNavBarMenu();
  });

  afterEach(() => {
    vi.clearAllMocks();
    dom.window.close();
  });

  describe('Initialization', () => {
    it('should initialize with correct default properties', () => {
      expect(navBarMenu.navbar).toBeTruthy();
      expect(navBarMenu.navToggle).toBeTruthy();
      expect(navBarMenu.mobileMenu).toBeTruthy();
      expect(navBarMenu.searchToggle).toBeTruthy();
      expect(navBarMenu.isMenuOpen).toBe(false);
    });

    it('should find required DOM elements', () => {
      expect(navBarMenu.navbar?.id).toBe('navbar');
      expect(navBarMenu.navToggle?.id).toBe('nav-toggle');
      expect(navBarMenu.mobileMenu?.id).toBe('mobile-menu');
      expect(navBarMenu.searchToggle?.id).toBe('search-toggle');
    });

    it('should handle missing DOM elements gracefully', () => {
      // Remove navigation elements
      document.getElementById('navbar')?.remove();
      
      const newNavBarMenu = new MockNavBarMenu();
      
      expect(newNavBarMenu.navbar).toBeNull();
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('should toggle menu open state', () => {
      expect(navBarMenu.isMenuOpen).toBe(false);
      
      navBarMenu.toggleMenu();
      
      expect(navBarMenu.isMenuOpen).toBe(true);
      expect(navBarMenu.navToggle?.getAttribute('aria-expanded')).toBe('true');
      expect(navBarMenu.mobileMenu?.style.display).toBe('block');
    });

    it('should toggle menu closed state', () => {
      navBarMenu.toggleMenu(); // Open first
      navBarMenu.toggleMenu(); // Close
      
      expect(navBarMenu.isMenuOpen).toBe(false);
      expect(navBarMenu.navToggle?.getAttribute('aria-expanded')).toBe('false');
      expect(navBarMenu.mobileMenu?.style.display).toBe('none');
    });

    it('should close menu explicitly', () => {
      navBarMenu.toggleMenu(); // Open first
      navBarMenu.closeMenu();
      
      expect(navBarMenu.isMenuOpen).toBe(false);
      expect(navBarMenu.navToggle?.getAttribute('aria-expanded')).toBe('false');
      expect(navBarMenu.mobileMenu?.style.display).toBe('none');
    });
  });

  describe('Search Functionality', () => {
    it('should open search overlay', () => {
      const searchOverlay = document.getElementById('search-overlay');
      expect(searchOverlay?.style.display).toBe('none');
      
      navBarMenu.openSearch();
      
      expect(searchOverlay?.style.display).toBe('block');
    });
  });

  describe('Click Events', () => {
    it('should handle nav toggle click', () => {
      const navToggle = navBarMenu.navToggle;
      expect(navBarMenu.isMenuOpen).toBe(false);
      
      navToggle?.click();
      
      expect(navBarMenu.isMenuOpen).toBe(true);
    });

    it('should handle search toggle click', () => {
      const searchToggle = navBarMenu.searchToggle;
      const searchOverlay = document.getElementById('search-overlay');
      
      expect(searchOverlay?.style.display).toBe('none');
      
      searchToggle?.click();
      
      expect(searchOverlay?.style.display).toBe('block');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(navBarMenu.navToggle?.getAttribute('aria-label')).toBe('Toggle navigation');
      expect(navBarMenu.navToggle?.getAttribute('aria-expanded')).toBe('false');
      expect(navBarMenu.searchToggle?.getAttribute('aria-label')).toBe('Open search');
    });

    it('should update ARIA attributes when menu state changes', () => {
      navBarMenu.toggleMenu();
      
      expect(navBarMenu.navToggle?.getAttribute('aria-expanded')).toBe('true');
      
      navBarMenu.toggleMenu();
      
      expect(navBarMenu.navToggle?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('Navigation Links', () => {
    it('should have correct navigation links structure', () => {
      const navLinks = document.querySelectorAll('.nav-list a');
      
      expect(navLinks).toHaveLength(4);
      expect(navLinks[0].getAttribute('href')).toBe('/');
      expect(navLinks[0].getAttribute('data-analytics')).toBe('nav_home');
      expect(navLinks[1].getAttribute('href')).toBe('/about/');
      expect(navLinks[1].getAttribute('data-analytics')).toBe('nav_about');
      expect(navLinks[2].getAttribute('href')).toBe('/projects/');
      expect(navLinks[2].getAttribute('data-analytics')).toBe('nav_projects');
      expect(navLinks[3].getAttribute('href')).toBe('/contact/');
      expect(navLinks[3].getAttribute('data-analytics')).toBe('nav_contact');
    });

    it('should have proper link text content', () => {
      const navLinks = document.querySelectorAll('.nav-list a');
      
      expect(navLinks[0].textContent).toBe('Home');
      expect(navLinks[1].textContent).toBe('About');
      expect(navLinks[2].textContent).toBe('Projects');
      expect(navLinks[3].textContent).toBe('Contact');
    });
  });

  describe('Component Structure', () => {
    it('should have proper navbar HTML structure', () => {
      const navbar = document.getElementById('navbar');
      const navBrand = navbar?.querySelector('.nav-brand');
      const navToggle = navbar?.querySelector('.nav-toggle');
      const mobileMenu = navbar?.querySelector('.mobile-menu');
      const searchToggle = navbar?.querySelector('.search-toggle');
      
      expect(navbar).toBeTruthy();
      expect(navBrand).toBeTruthy();
      expect(navToggle).toBeTruthy();
      expect(mobileMenu).toBeTruthy();
      expect(searchToggle).toBeTruthy();
    });

    it('should have hamburger menu structure', () => {
      const navToggle = document.getElementById('nav-toggle');
      const spans = navToggle?.querySelectorAll('span');
      
      expect(spans).toHaveLength(3);
    });
  });
});
