/**
 * Modern NavBar functionality
 * Handles mobile menu toggle, theme toggle, and search overlay
 */

export class ModernNavBar {
  private burgerButton: HTMLElement | null;
  private mobileMenu: HTMLElement | null;
  private closeMobileButton: HTMLElement | null;
  private themeToggle: HTMLElement | null;
  private searchToggle: HTMLElement | null;
  private searchOverlay: HTMLElement | null;
  private navbar: HTMLElement | null;

  constructor() {
    console.log('🔧 ModernNavBar constructor called');
    this.burgerButton = document.getElementById('nav-toggle');
    this.mobileMenu = document.getElementById('nav-mobile-links');
    this.closeMobileButton = document.getElementById('close-mobile-menu');
    this.themeToggle = document.getElementById('theme-toggle');
    this.searchToggle = document.getElementById('search-toggle');
    this.searchOverlay = document.getElementById('search-overlay');
    this.navbar = document.querySelector('nav');
    
    console.log('🔧 Elements found:', {
      burgerButton: this.burgerButton,
      mobileMenu: this.mobileMenu,
      closeMobileButton: this.closeMobileButton,
      themeToggle: this.themeToggle,
      searchToggle: this.searchToggle,
      searchOverlay: this.searchOverlay
    });
    
    this.init();
    this.initializeTheme();
  }

  init() {
    console.log('🔍 Setting up mobile menu...');
    this.setupMobileMenu();
    
    console.log('🎨 Setting up theme toggle...');
    this.setupThemeToggle();
    
    console.log('🔍 Setting up search overlay...');
    this.setupSearchOverlay();
    
    // Initialize scroll effects if available
    if (window.scrollEffects && this.navbar) {
      window.scrollEffects.setupScrollBehavior(this.navbar);
    }
    
    // Initialize analytics if available
    if (window.analyticsModule) {
      this.setupAnalytics();
    }
    
    // Initialize accessibility if available
    if (window.accessibilityModule) {
      this.setupAccessibility();
    }
    
    console.log('✅ ModernNavBar initialized');
  }

  setupMobileMenu() {
    if (!this.burgerButton || !this.mobileMenu) {
      console.error('❌ Mobile menu elements not found');
      return;
    }

    console.log('🍔 Burger button:', this.burgerButton);
    console.log('📱 Mobile menu:', this.mobileMenu);

    // Burger button click handler
    this.burgerButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🍔 Burger button clicked!');
      this.toggleMobileMenu();
    });

    // Close button click handler
    if (this.closeMobileButton) {
      this.closeMobileButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('❌ Close button clicked!');
        this.closeMobileMenu();
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.burgerButton?.contains(e.target as Node) && 
          !this.mobileMenu?.contains(e.target as Node)) {
        this.closeMobileMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    console.log('🔄 Toggling mobile menu...');
    if (!this.burgerButton || !this.mobileMenu) {
      console.error('❌ Elements not found for toggle');
      return;
    }
    
    const isOpen = this.mobileMenu.classList.contains('active');
    console.log('📱 Menu is open:', isOpen);
    console.log('🍔 Burger button classes before:', this.burgerButton.className);
    console.log('📱 Mobile menu classes before:', this.mobileMenu.className);
    
    if (isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    if (!this.burgerButton || !this.mobileMenu) return;
    
    console.log('Opening mobile menu...');
    console.log('📱 Mobile menu element:', this.mobileMenu);
    console.log('📱 Mobile menu computed right before:', window.getComputedStyle(this.mobileMenu).right);
    
    this.burgerButton.classList.add('active');
    this.burgerButton.setAttribute('aria-expanded', 'true');
    this.mobileMenu.classList.add('active');
    
    console.log('🍔 Burger button classes after:', this.burgerButton.className);
    console.log('📱 Mobile menu classes after:', this.mobileMenu.className);
    console.log('📱 Mobile menu computed right after:', window.getComputedStyle(this.mobileMenu).right);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus first link in mobile menu
    const firstLink = this.mobileMenu.querySelector('.mobile-nav-link');
    if (firstLink) {
      setTimeout(() => (firstLink as HTMLElement).focus(), 100);
    }
    
    this.announceToScreenReader('Mobile navigation menu opened');
  }

  closeMobileMenu() {
    if (!this.burgerButton || !this.mobileMenu) return;
    
    console.log('Closing mobile menu...');
    
    this.burgerButton.classList.remove('active');
    this.burgerButton.setAttribute('aria-expanded', 'false');
    this.mobileMenu.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Focus back to burger button
    this.burgerButton.focus();
    
    this.announceToScreenReader('Mobile navigation menu closed');
  }

  initializeTheme() {
    // BaseLayout already handles theme initialization
    // We just need to update the toggle button icon
    this.updateThemeToggleIcon();
  }

  updateThemeToggleIcon() {
    if (!this.themeToggle) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    const icon = this.themeToggle.querySelector('svg');
    
    if (icon) {
      icon.innerHTML = isDark 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
    }
  }

  setupThemeToggle() {
    if (!this.themeToggle) return;

    this.themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleTheme();
    });
  }

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      html.dataset.theme = 'dark';
    } else {
      html.classList.remove('dark');
      html.dataset.theme = 'light';
    }
    
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle button icon
    this.updateThemeToggleIcon();
    
    this.announceToScreenReader(`Theme switched to ${newTheme} mode`);
  }

  setupSearchOverlay() {
    if (!this.searchToggle || !this.searchOverlay) return;

    this.searchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.openSearchOverlay();
    });

    // Close search overlay on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.searchOverlay?.classList.contains('active')) {
        this.closeSearchOverlay();
      }
    });

    // Close search overlay when clicking outside
    this.searchOverlay?.addEventListener('click', (e) => {
      if (e.target === this.searchOverlay) {
        this.closeSearchOverlay();
      }
    });
  }

  openSearchOverlay() {
    if (!this.searchOverlay) return;
    
    this.searchOverlay.classList.add('active');
    this.searchOverlay.style.visibility = 'visible';
    this.searchOverlay.style.opacity = '1';
    
    // Focus search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      setTimeout(() => (searchInput as HTMLInputElement).focus(), 100);
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    this.announceToScreenReader('Search overlay opened');
  }

  closeSearchOverlay() {
    if (!this.searchOverlay) return;
    
    this.searchOverlay.classList.remove('active');
    this.searchOverlay.style.visibility = 'hidden';
    this.searchOverlay.style.opacity = '0';
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Focus back to search toggle
    if (this.searchToggle) {
      this.searchToggle.focus();
    }
    
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

  setupAnalytics() {
    if (!window.analyticsModule) return;
    
    // Track navigation events
    const navLinks = this.navbar?.querySelectorAll('a');
    navLinks?.forEach(link => {
      link.addEventListener('click', () => {
        const href = link.getAttribute('href');
        if (href && window.analyticsModule) {
          window.analyticsModule.trackNavigation(
            window.location.pathname,
            href,
            'click'
          );
        }
      });
    });
  }

  setupAccessibility() {
    if (!window.accessibilityModule) return;
    
    // Add landmark roles
    if (this.navbar) {
      this.navbar.setAttribute('role', 'navigation');
      this.navbar.setAttribute('aria-label', 'Main navigation');
    }
    
    // Highlight active link
    const currentPath = window.location.pathname;
    const navLinks = this.navbar?.querySelectorAll('a');
    navLinks?.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    });
  }
}

export function initModernNavBar(): ModernNavBar {
  console.log('🚀 Initializing ModernNavBar...');
  return new ModernNavBar();
} 