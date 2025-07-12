// a11y.js - Accessibility utility for navigation and general UI

/**
 * Add a skip to content link for accessibility
 */
export function addSkipToContentLink() {
  // Skip link is already provided in BaseLayout.astro, no need to add another
  return;
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