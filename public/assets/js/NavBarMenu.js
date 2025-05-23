// NavBarMenu.js: Unified navigation logic (merged with NavBarEnhanced.js)
// Features: Navigation hydration, ARIA, analytics, scroll effects, theme integration, accessibility, keyboard shortcuts, progressive enhancement

/**
 * Navigation link data structure
 * @typedef {Object} NavLink
 * @property {string} href - URL path
 * @property {string} label - Display text
 * @property {string} analytics - Data attribute for analytics tracking
 * @property {boolean} [external] - Whether this is an external link
 * @property {string} [target] - Target attribute for link (_blank, _self, etc.)
 * @property {NavLink[]} [children] - Child links for dropdown menus
 */

/**
 * Navigation links configuration
 * @type {NavLink[]}
 */
const navLinksData = [
  { href: '/', label: 'Home', analytics: 'nav-home' },
  { href: '/about/', label: 'About', analytics: 'nav-about' },
  { 
    href: '/projects/', 
    label: 'Projects', 
    analytics: 'nav-projects',
    // Example of dropdown menu:
    // children: [
    //   { href: '/projects/web/', label: 'Web Projects', analytics: 'nav-projects-web' },
    //   { href: '/projects/design/', label: 'Design Work', analytics: 'nav-projects-design' },
    //   { href: '/projects/open-source/', label: 'Open Source', analytics: 'nav-projects-opensource' },
    // ]
  },
  { href: '/blog/', label: 'Blog', analytics: 'nav-blog' },
  { href: '/contact/', label: 'Contact', analytics: 'nav-contact' },
  // Social media links - uncomment and customize as needed
  // { href: 'https://github.com/yourusername', label: 'GitHub', analytics: 'nav-github', external: true, target: '_blank' },
  // { href: 'https://linkedin.com/in/yourusername', label: 'LinkedIn', analytics: 'nav-linkedin', external: true, target: '_blank' },
  // { href: 'https://twitter.com/yourusername', label: 'Twitter', analytics: 'nav-twitter', external: true, target: '_blank' },
];

class NavBarMenu {
  constructor() {
    this.navbar = null;
    this.navToggle = null;
    this.mobileMenu = null;
    this.searchToggle = null;
    this.isMenuOpen = false;
    this.lastScrollY = window.scrollY;
    this.ticking = false;
    this.intersectionObserver = null;
    this.resizeObserver = null;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.cacheElements();
    this.addSkipToContentLink();
    this.setupScrollEffects();
    this.setupMobileMenu();
    this.setupKeyboardShortcuts();
    this.setupProgressiveEnhancements();
    this.setupThemeIntegration();
    this.setupAnalytics();
    this.setupAccessibilityEnhancements();
    this.highlightActiveLink();
    this.setupPageTransitions();
    this.setupScrollBehavior();
  }

  cacheElements() {
    this.navbar = document.querySelector('[data-navbar]') || document.querySelector('nav');
    this.navToggle = document.getElementById('nav-toggle');
    this.mobileMenu = document.getElementById('nav-mobile-links');
    this.searchToggle = document.getElementById('search-toggle');
    if (!this.navbar) {
      console.warn('NavBar: Main navbar element not found');
    }
  }

  // --- Scroll Effects ---
  setupScrollEffects() {
    let scrollTimeout;
    const handleScroll = () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateNavbarOnScroll();
          this.ticking = false;
        });
        this.ticking = true;
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.onScrollEnd();
      }, 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  updateNavbarOnScroll() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - this.lastScrollY;
    if (currentScrollY > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
    if (Math.abs(scrollDelta) > 5) {
      if (scrollDelta > 0 && currentScrollY > 100) {
        this.navbar.classList.remove('nav-visible');
        this.navbar.classList.add('nav-hidden');
      } else if (scrollDelta < 0) {
        this.navbar.classList.remove('nav-hidden');
        this.navbar.classList.add('nav-visible');
      }
    }
    this.lastScrollY = currentScrollY;
  }

  onScrollEnd() {
    this.navbar.classList.remove('nav-hidden');
    this.navbar.classList.add('nav-visible');
  }

  // --- Mobile Menu ---
  setupMobileMenu() {
    if (!this.navToggle || !this.mobileMenu) return;
    this.navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && !this.navbar.contains(e.target) && !this.mobileMenu.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
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
    document.body.style.overflow = 'hidden';
    const firstMenuItem = this.mobileMenu.querySelector('a, button');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 100);
    }
    document.body.classList.add('mobile-menu-open');
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove('open');
    this.navToggle.classList.remove('hamburger-open');
    this.navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.body.classList.remove('mobile-menu-open');
  }

  // --- Keyboard Shortcuts ---
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        this.searchToggle?.click();
      }
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
    document.body.classList.add('page-transition-exit');
    setTimeout(() => {
      window.location.href = url;
    }, 150);
  }

  // --- Progressive Enhancements ---
  setupProgressiveEnhancements() {
    const focusableElements = this.navbar.querySelectorAll('a, button');
    focusableElements.forEach(element => {
      element.classList.add('nav-focus');
    });
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }
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
        if (entry.contentRect.width >= 768 && this.isMenuOpen) {
          this.closeMobileMenu();
        }
      });
    });
    this.resizeObserver.observe(document.body);
  }

  // --- Theme Integration ---
  setupThemeIntegration() {
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
    this.handleThemeChange();
  }

  handleThemeChange() {
    const isDark = document.documentElement.classList.contains('dark');
    this.navbar.style.setProperty('--current-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      this.navbar.classList.add('theme-dark');
      this.navbar.classList.remove('theme-light');
    } else {
      this.navbar.classList.add('theme-light');
      this.navbar.classList.remove('theme-dark');
    }
  }

  // --- Analytics ---
  setupAnalytics() {
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
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => {
        this.trackEvent('mobile_menu_toggle', {
          action: this.isMenuOpen ? 'close' : 'open'
        });
      });
    }
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', () => {
        this.trackEvent('search_opened', {
          trigger: 'button_click'
        });
      });
    }
  }

  trackEvent(eventName, eventData = {}) {
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

  // --- Accessibility ---
  setupAccessibilityEnhancements() {
    this.addSkipToContentLink();
    this.enhanceFocusManagement();
    this.addLandmarkRoles();
  }

  addSkipToContentLink() {
    if (!document.getElementById('skip-to-content')) {
      const skipLink = document.createElement('a');
      skipLink.id = 'skip-to-content';
      skipLink.href = '#main';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-accent';
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  enhanceFocusManagement() {
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

  // --- Active Link Highlighting ---
  highlightActiveLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('#nav-links a, #nav-mobile-links a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isActive = href === currentPath ||
        (currentPath === '/' && href === '/') ||
        (href !== '/' && currentPath.startsWith(href));
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // --- Page Transitions ---
  setupPageTransitions() {
    if (!('navigation' in window)) return;
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-transparent z-50';
    progressIndicator.id = 'page-transition-progress';
    document.body.appendChild(progressIndicator);
    const internalLinks = document.querySelectorAll('a[href^="/"]:not([target="_blank"])');
    internalLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const href = link.getAttribute('href');
        if (link.hasAttribute('download') || href.includes('#') || link.hasAttribute('target')) return;
        event.preventDefault();
        document.body.classList.add('page-transition-exit');
        const indicator = document.getElementById('page-transition-progress');
        if (indicator) {
          indicator.style.background = 'linear-gradient(to right, var(--color-accent) 0%, var(--color-accent-light) 50%, var(--color-accent) 100%)';
          indicator.style.width = '0%';
          indicator.style.opacity = '1';
          setTimeout(() => { indicator.style.width = '60%'; indicator.style.transition = 'width 150ms ease-out'; }, 10);
          setTimeout(() => { indicator.style.width = '80%'; indicator.style.transition = 'width 800ms ease-out'; }, 150);
        }
        setTimeout(() => {
          window.location.href = href;
        }, 250);
      });
    });
    window.addEventListener('pageshow', () => {
      document.body.classList.add('page-transition-enter');
      const indicator = document.getElementById('page-transition-progress');
      if (indicator) {
        indicator.style.width = '100%';
        indicator.style.transition = 'width 200ms ease-out';
        setTimeout(() => {
          indicator.style.opacity = '0';
          indicator.style.transition = 'opacity 300ms ease-out';
        }, 200);
      }
      setTimeout(() => {
        document.body.classList.remove('page-transition-enter');
      }, 300);
    });
  }

  // --- Scroll Behavior (Hide on scroll down, show on scroll up) ---
  setupScrollBehavior() {
    let lastScrollTop = 0;
    const navbar = this.navbar;
    const scrollThreshold = 50;
    if (!navbar) return;
    const handleScroll = this.debounce(() => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      if (Math.abs(lastScrollTop - currentScroll) < scrollThreshold) return;
      if (currentScroll > lastScrollTop && currentScroll > 100) {
        navbar.classList.add('nav-hidden');
        navbar.classList.remove('nav-visible');
      } else {
        navbar.classList.add('nav-visible');
        navbar.classList.remove('nav-hidden');
      }
      lastScrollTop = currentScroll;
    }, 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize the unified navbar
window.navBarMenu = new NavBarMenu();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavBarMenu;
}
