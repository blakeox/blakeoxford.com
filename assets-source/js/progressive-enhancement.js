/**
 * Progressive Enhancement Framework
 * Ensures functionality works without JavaScript and enhances when available
 */

export class ProgressiveEnhancement {
  constructor() {
    this.features = new Map();
    this.init();
  }

  init() {
    // Mark that JavaScript is available
    document.documentElement.classList.add('js-enabled');
    document.documentElement.classList.remove('no-js');
    
    // Initialize core enhancements
    this.setupCoreEnhancements();
    this.setupAccessibilityEnhancements();
    this.setupPerformanceEnhancements();
  }

  setupCoreEnhancements() {
    // Form enhancements
    this.enhanceForms();
    
    // Navigation enhancements
    this.enhanceNavigation();
    
    // Content enhancements
    this.enhanceContent();
  }

  enhanceForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Enhance form with real-time validation only if JS is available
      form.classList.add('js-enhanced');
      
      // Add loading states
      const submitButtons = form.querySelectorAll('button[type="submit"]');
      submitButtons.forEach(button => {
        button.addEventListener('click', () => {
          button.setAttribute('aria-busy', 'true');
          button.classList.add('loading');
        });
      });
      
      // Enhanced error handling
      form.addEventListener('invalid', (e) => {
        e.preventDefault();
        this.showFieldError(e.target);
      }, true);
    });
  }

  enhanceNavigation() {
    // Progressive mobile menu enhancement
    const mobileToggle = document.querySelector('#nav-toggle');
    const mobileMenu = document.querySelector('#nav-mobile-links');
    
    if (mobileToggle && mobileMenu) {
      // Remove CSS-only fallbacks and add JS enhancements
      mobileMenu.classList.add('js-enhanced');
      
      // Add ARIA attributes for enhanced experience
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-controls', 'nav-mobile-links');
    }
  }

  enhanceContent() {
    // Progressive loading for images
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      this.setupLazyLoading(images);
    } else {
      // Fallback: load all images immediately
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      });
    }
  }

  setupAccessibilityEnhancements() {
    // Enhanced keyboard navigation
    this.setupEnhancedKeyboardNav();
    
    // Screen reader improvements
    this.setupScreenReaderEnhancements();
    
    // Motion preference handling
    this.setupMotionPreferences();
  }

  setupEnhancedKeyboardNav() {
    // Skip link improvements
    const skipLinks = document.querySelectorAll('.skip-link');
    skipLinks.forEach(link => {
      link.addEventListener('focus', () => {
        link.style.transform = 'translateY(0)';
      });
      
      link.addEventListener('blur', () => {
        link.style.transform = 'translateY(-100%)';
      });
    });

    // Arrow key navigation for lists
    const navigableLists = document.querySelectorAll('[role="list"], ul, ol');
    navigableLists.forEach(list => {
      this.addArrowKeyNavigation(list);
    });
  }

  setupScreenReaderEnhancements() {
    // Live region for dynamic content
    if (!document.querySelector('#live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Enhanced form announcements
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        this.announce('Form submitted. Please wait for confirmation.');
      });
    });
  }

  setupMotionPreferences() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionPreference = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
        this.announce('Animations reduced for accessibility.');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    prefersReducedMotion.addEventListener('change', handleMotionPreference);
    handleMotionPreference(prefersReducedMotion);
  }

  setupPerformanceEnhancements() {
    // Connection-aware loading
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.documentElement.classList.add('slow-connection');
        this.disableHeavyAnimations();
      }
    }

    // Battery API consideration
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          document.documentElement.classList.add('low-battery');
          this.enablePowerSavingMode();
        }
      });
    }
  }

  // Utility methods
  setupLazyLoading(images) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  addArrowKeyNavigation(list) {
    const items = list.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    
    list.addEventListener('keydown', (e) => {
      const currentIndex = Array.from(items).indexOf(e.target);
      let newIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      items[newIndex]?.focus();
    });
  }

  showFieldError(field) {
    const errorId = `${field.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'field-error';
      errorElement.setAttribute('role', 'alert');
      field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = field.validationMessage;
    field.setAttribute('aria-describedby', errorId);
    field.setAttribute('aria-invalid', 'true');
  }

  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  disableHeavyAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  enablePowerSavingMode() {
    document.documentElement.classList.add('power-saving');
    this.disableHeavyAnimations();
    
    // Disable background videos, heavy effects, etc.
    const heavyElements = document.querySelectorAll('video, .parallax, .heavy-animation');
    heavyElements.forEach(el => {
      el.style.display = 'none';
    });
  }
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ProgressiveEnhancement();
    });
  } else {
    new ProgressiveEnhancement();
  }
}
