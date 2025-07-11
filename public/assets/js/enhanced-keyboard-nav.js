/**
 * Enhanced Keyboard Navigation Module
 * Provides advanced keyboard navigation patterns beyond basic Tab navigation
 */

export class EnhancedKeyboardNavigation {
  constructor() {
    this.initializeArrowKeyNavigation();
    this.initializeEscapeKeyHandling();
    this.initializeHomeEndKeys();
  }

  initializeArrowKeyNavigation() {
    // Arrow key navigation for horizontal navigation menus
    const navMenus = document.querySelectorAll('[role="menubar"], nav ul');
    
    navMenus.forEach(menu => {
      const items = menu.querySelectorAll('a, button');
      
      menu.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        
        e.preventDefault();
        const currentIndex = Array.from(items).indexOf(e.target as Element);
        let nextIndex = currentIndex;
        
        switch (e.key) {
          case 'ArrowLeft':
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            break;
          case 'ArrowRight':
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            break;
          case 'Home':
            nextIndex = 0;
            break;
          case 'End':
            nextIndex = items.length - 1;
            break;
        }
        
        (items[nextIndex] as HTMLElement)?.focus();
      });
    });
  }

  initializeEscapeKeyHandling() {
    // Global escape key handling for modals and overlays
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('[aria-modal="true"]:not([aria-hidden="true"])');
        const openOverlays = document.querySelectorAll('.search-overlay.active, .mobile-menu.active');
        
        if (openModals.length > 0) {
          // Close the topmost modal
          const modal = openModals[openModals.length - 1];
          const closeButton = modal.querySelector('[data-close], .close-button, .search-close-button');
          (closeButton as HTMLElement)?.click();
        } else if (openOverlays.length > 0) {
          // Close overlays
          openOverlays.forEach(overlay => {
            overlay.classList.remove('active');
          });
        }
      }
    });
  }

  initializeHomeEndKeys() {
    // Home/End keys for long content areas
    const contentAreas = document.querySelectorAll('main, article, .prose');
    
    contentAreas.forEach(area => {
      area.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 'Home' || e.key === 'End')) {
          e.preventDefault();
          if (e.key === 'Home') {
            area.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
          }
        }
      });
    });
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new EnhancedKeyboardNavigation();
  });
}
