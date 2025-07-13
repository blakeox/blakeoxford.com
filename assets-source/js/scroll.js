// scroll.js: Scroll effects and behaviors for navigation and page transitions

/**
 * Setup scroll effects with requestAnimationFrame throttling
 * @param {Object} context - Context object with ticking flag and callback methods
 */
export function setupScrollEffects(context) {
  if (!context) return;
  
  let scrollTimeout;
  
  const handleScroll = () => {
    if (context.ticking) return;
    
    context.ticking = true;
    requestAnimationFrame(() => {
      if (context.updateNavbarOnScroll) {
        context.updateNavbarOnScroll();
      }
      context.ticking = false;
    });
    
    // Handle scroll end event
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (context.onScrollEnd) {
        context.onScrollEnd();
      }
    }, 150);
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Setup scroll behavior for hiding/showing navbar on scroll
 * @param {HTMLElement} navbar - The navbar element to control
 */
export function setupScrollBehavior(navbar) {
  if (!navbar) return;
  
  let lastScrollTop = 0;
  const scrollThreshold = 50;
  
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  const handleScroll = debounce(() => {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    
    if (Math.abs(lastScrollTop - currentScroll) < scrollThreshold) return;
    
    if (currentScroll > lastScrollTop && currentScroll > 100) {
      // Scrolling down
      navbar.classList.add('nav-hidden');
      navbar.classList.remove('nav-visible');
    } else {
      // Scrolling up
      navbar.classList.add('nav-visible');
      navbar.classList.remove('nav-hidden');
    }
    
    lastScrollTop = currentScroll;
  }, 50);
  
  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Setup page transitions with progress indicators
 */
export function setupPageTransitions() {
  // Only setup if Navigation API is supported
  if (!('navigation' in window)) return;
  
  // Create progress indicator
  const progressIndicator = document.createElement('div');
  progressIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-transparent z-50';
  progressIndicator.id = 'page-transition-progress';
  document.body.appendChild(progressIndicator);
  
  // Setup click handlers for internal links
  const internalLinks = document.querySelectorAll('a[href^="/"]:not([target="_blank"])');
  
  internalLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      // Allow modified clicks (ctrl+click, etc.)
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      
      const href = link.getAttribute('href');
      
      // Skip downloads, anchors, and external links
      if (link.hasAttribute('download') || href.includes('#') || link.hasAttribute('target')) return;
      
      event.preventDefault();
      
      // Add exit transition class
      document.body.classList.add('page-transition-exit');
      
      // Animate progress indicator
      const indicator = document.getElementById('page-transition-progress');
      if (indicator) {
        indicator.style.background = 'linear-gradient(to right, var(--color-accent) 0%, var(--color-accent-light) 50%, var(--color-accent) 100%)';
        indicator.style.width = '0%';
        indicator.style.opacity = '1';
        
        // Animate progress
        setTimeout(() => {
          indicator.style.width = '60%';
          indicator.style.transition = 'width 150ms ease-out';
        }, 10);
        
        setTimeout(() => {
          indicator.style.width = '80%';
          indicator.style.transition = 'width 800ms ease-out';
        }, 150);
      }
      
      // Navigate after transition
      setTimeout(() => {
        window.location.href = href;
      }, 250);
    });
  });
  
  // Handle page show event
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
