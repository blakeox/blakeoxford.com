/**
 * Robust Focus Trap Implementation
 * Ensures proper focus management for modal dialogs and overlays
 */

export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = null;
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.previouslyFocusedElement = null;
    this.isActive = false;
  }

  activate() {
    if (this.isActive) return;
    
    // Store previously focused element
    this.previouslyFocusedElement = document.activeElement;
    
    // Get focusable elements
    this.updateFocusableElements();
    
    // Add event listeners
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    
    // Focus first element
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
    
    this.isActive = true;
  }

  deactivate() {
    if (!this.isActive) return;
    
    // Remove event listeners
    this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    
    // Restore focus
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      this.previouslyFocusedElement.focus();
    }
    
    this.isActive = false;
  }

  updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors)
    ).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.hasAttribute('inert');
    });

    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
  }

  handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    if (e.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === this.firstFocusableElement) {
        e.preventDefault();
        this.lastFocusableElement.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === this.lastFocusableElement) {
        e.preventDefault();
        this.firstFocusableElement.focus();
      }
    }
  }

  handleFocusIn(e) {
    if (!this.element.contains(e.target)) {
      e.preventDefault();
      if (this.firstFocusableElement) {
        this.firstFocusableElement.focus();
      }
    }
  }
}

// Utility function to create and manage focus traps
export function createFocusTrap(element) {
  return new FocusTrap(element);
}
