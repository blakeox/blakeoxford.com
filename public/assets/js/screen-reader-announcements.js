/**
 * Screen Reader Announcements Module
 * Provides live region announcements for dynamic content changes
 */

export class ScreenReaderAnnouncements {
  constructor() {
    this.createLiveRegions();
    this.initializeRouteAnnouncements();
    this.initializeFormFeedback();
  }

  createLiveRegions() {
    // Create polite announcements region
    if (!document.getElementById('sr-live-polite')) {
      const politeRegion = document.createElement('div');
      politeRegion.id = 'sr-live-polite';
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
    }

    // Create assertive announcements region for urgent messages
    if (!document.getElementById('sr-live-assertive')) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'sr-live-assertive';
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
    }
  }

  announce(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'sr-live-assertive' : 'sr-live-polite';
    const region = document.getElementById(regionId);
    
    if (region) {
      // Clear and then set the message to ensure it's announced
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
      
      // Clear after 5 seconds to prevent buildup
      setTimeout(() => {
        region.textContent = '';
      }, 5000);
    }
  }

  initializeRouteAnnouncements() {
    // Announce page changes for SPA-like navigation
    let currentPath = window.location.pathname;
    
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        const pageTitle = document.querySelector('h1')?.textContent || document.title;
        this.announce(`Navigated to ${pageTitle}`, 'polite');
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  initializeFormFeedback() {
    // Enhanced form validation announcements
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const requiredFields = form.querySelectorAll('[required]');
        const invalidFields = [];
        
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            invalidFields.push(field.getAttribute('aria-label') || field.name || 'Unknown field');
          }
        });
        
        if (invalidFields.length > 0) {
          e.preventDefault();
          this.announce(
            `Form submission failed. Please complete the following required fields: ${invalidFields.join(', ')}`,
            'assertive'
          );
        } else {
          this.announce('Form submitted successfully', 'polite');
        }
      });
    });
  }

  // Method for announcing search results
  announceSearchResults(count, query) {
    if (count === 0) {
      this.announce(`No results found for "${query}". Try different keywords.`, 'polite');
    } else if (count === 1) {
      this.announce(`Found 1 result for "${query}"`, 'polite');
    } else {
      this.announce(`Found ${count} results for "${query}"`, 'polite');
    }
  }

  // Method for announcing loading states
  announceLoading(message = 'Loading content, please wait') {
    this.announce(message, 'polite');
  }

  announceLoadingComplete(message = 'Content loaded successfully') {
    this.announce(message, 'polite');
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.srAnnouncer = new ScreenReaderAnnouncements();
}
