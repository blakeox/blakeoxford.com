// NavBarMenu.js: Modular enhancement for navigation (ARIA, scroll, keyboard, analytics, accessibility, dropdowns, etc.)
// Imports analytics, accessibility, scroll, and dropdown utilities
import { trackEvent } from './analytics.js';
import { addSkipToContentLink, enhanceFocusManagement } from './a11y.js';
import { setupScrollEffects, setupScrollBehavior, setupPageTransitions } from './scroll.js';
import { setupDropdowns, setupDropdownKeyboardNavigation } from './dropdown.js';
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
    addSkipToContentLink();
    // Use modular scroll utilities
    setupScrollEffects(this);
    setupScrollBehavior(this.navbar);
    setupPageTransitions();
    // Enable interactive dropdowns and keyboard navigation
    setupDropdowns();
    setupDropdownKeyboardNavigation();
    this.setupMobileMenu();
    this.setupKeyboardShortcuts();
    this.setupProgressiveEnhancements();
    this.setupThemeIntegration();
    this.setupAnalytics();
    this.setupAccessibilityEnhancements();
    this.highlightActiveLink();
    this.setupAnimatedUnderline();
    this.setupScrollProgressBar();
    this.setupCommandPalette();
    this.setupHelpModal();
    this.setupContextualNavClass();
    this.setupSoundEffects();
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

  // --- Mobile Menu ---
  setupMobileMenu() {
    if (!this.navToggle || !this.mobileMenu) return;
    this.overlay = document.querySelector('.mobile-menu-overlay');
    this.navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        if (this.isMenuOpen) this.closeMobileMenu();
      });
    }
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && !this.navbar.contains(e.target) && !this.mobileMenu.contains(e.target) && (!this.overlay || !this.overlay.contains(e.target))) {
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
    if (this.overlay) this.overlay.style.display = 'block';
    const focusable = this.mobileMenu.querySelectorAll('a, button');
    if (focusable.length) {
      setTimeout(() => focusable[0].focus(), 100);
    }
    this.focusTrapHandler = (e) => {
      if (!this.isMenuOpen) return;
      if (e.key !== 'Tab') return;
      const focusableEls = Array.from(this.mobileMenu.querySelectorAll('a, button'));
      if (!focusableEls.length) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', this.focusTrapHandler, true);
    document.body.classList.add('mobile-menu-open');
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove('open');
    this.navToggle.classList.remove('hamburger-open');
    this.navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (this.overlay) this.overlay.style.display = 'none';
    document.removeEventListener('keydown', this.focusTrapHandler, true);
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
        trackEvent('navigation_click', {
          link_id: analyticsId,
          link_url: link.href,
          link_text: link.textContent.trim()
        });
      });
    });
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => {
        trackEvent('mobile_menu_toggle', {
          action: this.isMenuOpen ? 'close' : 'open'
        });
      });
    }
    if (this.searchToggle) {
      this.searchToggle.addEventListener('click', () => {
        trackEvent('search_opened', {
          trigger: 'button_click'
        });
      });
    }
  }

  // --- Accessibility ---
  setupAccessibilityEnhancements() {
    addSkipToContentLink();
    enhanceFocusManagement(this.navbar, this.trapFocus.bind(this), () => this.isMenuOpen);
    this.addLandmarkRoles();
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

  setupAnimatedUnderline() {
    const navLinks = Array.from(document.querySelectorAll('#nav-links .nav-link'));
    const blob = document.getElementById('nav-blob-underline');
    if (!blob || !navLinks.length) return;
    const moveBlob = (el) => {
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement.parentElement.getBoundingClientRect();
      blob.style.width = rect.width + 'px';
      blob.style.transform = `translateX(${rect.left - parentRect.left}px)`;
      blob.style.opacity = 1;
    };
    const resetBlob = () => {
      const active = navLinks.find(l => l.getAttribute('aria-current') === 'page');
      if (active) moveBlob(active);
      else blob.style.opacity = 0;
    };
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => moveBlob(link));
      link.addEventListener('focus', () => moveBlob(link));
      link.addEventListener('mouseleave', resetBlob);
      link.addEventListener('blur', resetBlob);
    });
    window.addEventListener('resize', resetBlob);
    resetBlob();
  }

  setupScrollProgressBar() {
    const bar = document.getElementById('nav-scroll-progress-bar');
    if (!bar) return;
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = percent + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  setupCommandPalette() {
    const modal = document.getElementById('nav-cmdk-modal');
    const btn = document.getElementById('nav-cmdk-toggle');
    const input = modal?.querySelector('input');
    const open = () => {
      modal.classList.add('active');
      setTimeout(() => input?.focus(), 100);
    };
    const close = () => {
      modal.classList.remove('active');
    };
    btn?.addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        close();
      }
    });
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  setupHelpModal() {
    const modal = document.getElementById('nav-help-modal');
    const btn = document.getElementById('nav-help-toggle');
    const open = () => modal.classList.add('active');
    const close = () => modal.classList.remove('active');
    btn?.addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        close();
      }
    });
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  setupContextualNavClass() {
    const path = window.location.pathname;
    let context = '';
    if (path.startsWith('/blog')) context = 'nav-context-blog';
    else if (path.startsWith('/projects')) context = 'nav-context-projects';
    else if (path.startsWith('/contact')) context = 'nav-context-contact';
    if (context) this.navbar.classList.add(context);
  }

  setupSoundEffects() {
    const play = (el) => {
      const sound = el.getAttribute('data-sound');
      if (sound) console.log('Play sound:', sound); // Replace with real sound logic
    };
    document.querySelectorAll('[data-sound]').forEach(el => {
      el.addEventListener('click', () => play(el));
      el.addEventListener('focus', () => play(el));
      el.addEventListener('mouseenter', () => play(el));
    });
  }
}

// Initialize the unified navbar
window.navBarMenu = new NavBarMenu();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavBarMenu;
}
