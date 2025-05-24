// scroll.js - Scroll and page transition utilities for navigation

/**
 * Setup scroll effects for navbar (hide/show on scroll, progress bar)
 * @param {Object} context - The NavBarMenu instance or context
 */
export function setupScrollEffects(context) {
  let scrollTimeout;
  const handleScroll = () => {
    if (!context.ticking) {
      requestAnimationFrame(() => {
        if (typeof context.updateNavbarOnScroll === 'function') {
          context.updateNavbarOnScroll();
        }
        context.ticking = false;
      });
      context.ticking = true;
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (typeof context.onScrollEnd === 'function') {
        context.onScrollEnd();
      }
    }, 150);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Setup scroll behavior for navbar (hide on scroll down, show on scroll up)
 * @param {HTMLElement} navbar - The navbar element
 */
export function setupScrollBehavior(navbar) {
  let lastScrollTop = 0;
  const scrollThreshold = 50;
  if (!navbar) return;
  const handleScroll = debounce(() => {
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

/**
 * Setup smooth page transitions using the Navigation API
 */
export function setupPageTransitions() {
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

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
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