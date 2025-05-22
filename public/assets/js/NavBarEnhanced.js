// NavBarEnhanced.js: Advanced navigation enhancements for a portfolio showcase
// Features: Dynamic scroll effects, micro-interactions, progressive enhancement, and theme integration

class NavBarEnhancer {
  constructor() {
    this.navbar = null;
    this.navToggle = null;
    this.mobileMenu = null;
    this.searchToggle = null;
    this.isMenuOpen = false;
    this.lastScrollY = window.scrollY;
    this.ticking = false;
    
    // Performance optimizations
    this.intersectionObserver = null;
    this.resizeObserver = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.cacheElements();
    this.setupScrollEffects();
    this.setupMobileMenu();
    this.setupKeyboardShortcuts();
    this.setupProgressiveEnhancements();
    this.setupThemeIntegration();
    this.setupAnalytics();
    this.setupAccessibilityEnhancements();
  }

  cacheElements() {
    this.navbar = document.querySelector('[data-navbar]');
    this.navToggle = document.getElementById('nav-toggle');
    this.mobileMenu = document.getElementById('nav-mobile-links')?.parentElement;
    this.searchToggle = document.getElementById('search-toggle');
    
    if (!this.navbar) {
      console.warn('NavBar: Main navbar element not found');
      return;
    }
  }

  setupScrollEffects() {
    let scrollTimeout;
    
    const handleScroll = () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateNavbarOnScroll();
          this.updateScrollProgress();
          this.ticking = false;
        });
        this.ticking = true;
      }
      
      // Clear existing timeout and set a new one
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.onScrollEnd();
      }, 150);
    };

    // Use passive listeners for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  updateNavbarOnScroll() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - this.lastScrollY;
    
    // Add/remove scrolled class for enhanced styling
    if (currentScrollY > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
    
    // Hide/show navbar based on scroll direction
    if (Math.abs(scrollDelta) > 5) {
      if (scrollDelta > 0 && currentScrollY > 100) {
        // Scrolling down - hide navbar
        this.navbar.classList.remove('nav-visible');
        this.navbar.classList.add('nav-hidden');
      } else if (scrollDelta < 0) {
        // Scrolling up - show navbar
        this.navbar.classList.remove('nav-hidden');
        this.navbar.classList.add('nav-visible');
      }
    }
    
    this.lastScrollY = currentScrollY;
  }

  updateScrollProgress() {
    const scrollProgress = document.getElementById('scroll-progress');
    if (!scrollProgress) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    scrollProgress.style.transform = `scaleX(${Math.min(scrollPercent / 100, 1)})`;
  }

  onScrollEnd() {
    // Always show navbar when user stops scrolling
    this.navbar.classList.remove('nav-hidden');
    this.navbar.classList.add('nav-visible');
  }

  setupMobileMenu() {
    if (!this.navToggle || !this.mobileMenu) return;

    // Enhanced hamburger animation
    const hamburgerContainer = this.navToggle.querySelector('.hamburger-container');
    
    this.navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.navbar.contains(e.target) && 
          !this.mobileMenu.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
        this.navToggle.focus();
      }
    });
  }

  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    this.isMenuOpen = true;
    this.mobileMenu.classList.add('open');
    this.navToggle.classList.add('hamburger-open');
    this.navToggle.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    
    // Focus first menu item for accessibility
    const firstMenuItem = this.mobileMenu.querySelector('a, button');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 100);
    }

    // Add page transition class
    document.body.classList.add('mobile-menu-open');
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove('open');
    this.navToggle.classList.remove('hamburger-open');
    this.navToggle.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.classList.remove('mobile-menu-open');
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Search shortcut: '/' key
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        this.searchToggle?.click();
      }
      
      // Navigation shortcuts
      if (e.altKey) {
        switch (e.key) {
          case 'h':
          case 'Home':
            e.preventDefault();
            this.navigateToPage('/');
            break;
          case 'a':
            e.preventDefault();
            this.navigateToPage('/about/');
            break;
          case 'p':
            e.preventDefault();
            this.navigateToPage('/projects/');
            break;
          case 'b':
            e.preventDefault();
            this.navigateToPage('/blog/');
            break;
          case 'c':
            e.preventDefault();
            this.navigateToPage('/contact/');
            break;
        }
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

  navigateToPage(url) {
    // Add page transition effect
    document.body.classList.add('page-transition-exit');
    
    setTimeout(() => {
      window.location.href = url;
    }, 150);
  }

  setupProgressiveEnhancements() {
    // Add enhanced focus indicators
    const focusableElements = this.navbar.querySelectorAll('a, button');
    focusableElements.forEach(element => {
      element.classList.add('nav-focus');
    });

    // Add intersection observer for enhanced visibility detection
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }

    // Add resize observer for responsive behavior
    if ('ResizeObserver' in window) {
      this.setupResizeObserver();
    }
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1, 0.5, 1]
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Add visual feedback based on navbar visibility
        if (entry.target === this.navbar) {
          this.navbar.style.setProperty('--navbar-visibility', entry.intersectionRatio);
        }
      });
    }, options);

    this.intersectionObserver.observe(this.navbar);
  }

  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        // Close mobile menu on resize to desktop
        if (entry.contentRect.width >= 768 && this.isMenuOpen) {
          this.closeMobileMenu();
        }
      });
    });

    this.resizeObserver.observe(document.body);
  }

  setupThemeIntegration() {
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          this.handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Initial theme setup
    this.handleThemeChange();
  }

  handleThemeChange() {
    const isDark = document.documentElement.classList.contains('dark');
    
    // Update navbar theme properties
    this.navbar.style.setProperty('--current-theme', isDark ? 'dark' : 'light');
    
    // Add theme-specific enhancements
    if (isDark) {
      this.navbar.classList.add('theme-dark');
      this.navbar.classList.remove('theme-light');
    } else {
      this.navbar.classList.add('theme-light');
      this.navbar.classList.remove('theme-dark');
    }
  }

  setupAnalytics() {
    // Track navigation interactions
    const navLinks = this.navbar.querySelectorAll('a[data-analytics]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const analyticsId = link.dataset.analytics;
        this.trackEvent('navigation_click', {
          link_id: analyticsId,
          link_url: link.href,
          link_text: link.textContent.trim()
        });
      });
    });

    // Track mobile menu usage
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => {
        this.trackEvent('mobile_menu_toggle', {
          action: this.isMenuOpen ? 'close' : 'open'
        });
      });
    }

    // Track search usage
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', () => {
        this.trackEvent('search_opened', {
          trigger: 'button_click'
        });
      });
    }
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
      console.debug('[NavBar Analytics]', eventName, eventData);
    }
  }

  setupAccessibilityEnhancements() {
    // Add skip navigation for screen readers
    this.addSkipNavigation();
    
    // Enhance focus management
    this.enhanceFocusManagement();
    
    // Add landmark roles
    this.addLandmarkRoles();
  }

  addSkipNavigation() {
    if (!document.getElementById('skip-nav')) {
      const skipNav = document.createElement('a');
      skipNav.id = 'skip-nav';
      skipNav.href = '#main-content';
      skipNav.textContent = 'Skip to main content';
      skipNav.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-background focus:rounded';
      
      document.body.insertBefore(skipNav, document.body.firstChild);
    }
  }

  enhanceFocusManagement() {
    // Trap focus in mobile menu when open
    this.navbar.addEventListener('keydown', (e) => {
      if (this.isMenuOpen && e.key === 'Tab') {
        this.trapFocus(e);
      }
    });
  }

  trapFocus(e) {
    const focusableElements = this.mobileMenu.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  addLandmarkRoles() {
    if (this.navbar && !this.navbar.getAttribute('role')) {
      this.navbar.setAttribute('role', 'navigation');
    }
  }

  // Public API methods
  refresh() {
    this.cacheElements();
    this.handleThemeChange();
  }

  destroy() {
    // Clean up event listeners and observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Restore body styles
    document.body.style.overflow = '';
    document.body.classList.remove('mobile-menu-open');
  }
}

// Initialize the enhanced navbar
window.navBarEnhancer = new NavBarEnhancer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavBarEnhancer;
}
