// a11y.js - Accessibility utility for navigation and general UI

/**
 * Add a skip to content link for accessibility
 */
export function addSkipToContentLink() {
  if (!document.getElementById('skip-to-content')) {
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-accent';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}

/**
 * Enhance focus management for keyboard navigation
 * @param {HTMLElement} navbar - The navbar element
 * @param {Function} trapFocus - The function to trap focus
 * @param {Function} isMenuOpen - Function returning whether the menu is open
 */
export function enhanceFocusManagement(navbar, trapFocus, isMenuOpen) {
  navbar.addEventListener('keydown', (e) => {
    if (isMenuOpen() && e.key === 'Tab') {
      trapFocus(e);
    }
  });
} 