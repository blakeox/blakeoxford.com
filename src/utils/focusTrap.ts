/**
 * Focus Trap Utility
 * 
 * Manages focus trapping within modals, dialogs, and other overlay components.
 * Ensures keyboard users can navigate within the trap and cannot tab outside.
 * 
 * @example
 * ```typescript
 * import { createFocusTrap } from '@/utils/focusTrap';
 * 
 * const trap = createFocusTrap(containerRef.current);
 * trap.activate();
 * // ... later
 * trap.deactivate();
 * ```
 */

/**
 * Focusable element selectors (WCAG compliant)
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }
  );
}

/**
 * Focus trap instance
 */
export interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
  update: () => void;
}

/**
 * Create a focus trap for a container element
 * 
 * @param container - The container element to trap focus within
 * @param options - Configuration options
 * @returns Focus trap instance with activate/deactivate methods
 */
export function createFocusTrap(
  container: HTMLElement | null,
  options: {
    initialFocus?: HTMLElement | null;
    returnFocus?: HTMLElement | null;
    fallbackFocus?: HTMLElement | null;
  } = {}
): FocusTrap {
  if (!container) {
    // Return no-op trap if container is null
    return {
      activate: () => {},
      deactivate: () => {},
      update: () => {},
    };
  }

  const {
    initialFocus = null,
    returnFocus = null,
    fallbackFocus = null,
  } = options;

  let previousActiveElement: HTMLElement | null = null;
  let isActive = false;
  let firstFocusableElement: HTMLElement | null = null;
  let lastFocusableElement: HTMLElement | null = null;

  /**
   * Handle Tab key to cycle focus within trap
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (!isActive || event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: move backward
      if (document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement?.focus();
      }
    } else {
      // Tab: move forward
      if (document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement?.focus();
      }
    }
  }

  /**
   * Handle clicks outside container to prevent focus escape
   */
  function handleClick(event: MouseEvent): void {
    if (!isActive) {
      return;
    }

    const target = event.target as Node;
    if (container && !container.contains(target)) {
      // Click outside - refocus first element
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus();
      }
    }
  }

  /**
   * Activate the focus trap
   */
  function activate(): void {
    if (isActive || !container) {
      return;
    }

    isActive = true;
    previousActiveElement = document.activeElement as HTMLElement;

    // Get focusable elements
    const focusableElements = getFocusableElements(container);
    firstFocusableElement = focusableElements[0] || null;
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null;

    // Set initial focus
    const elementToFocus = initialFocus || firstFocusableElement || fallbackFocus || container;
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus();
    }

    // Add event listeners
    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick, true);
  }

  /**
   * Deactivate the focus trap
   */
  function deactivate(): void {
    if (!isActive || !container) {
      return;
    }

    isActive = false;

    // Remove event listeners
    container.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('click', handleClick, true);

    // Return focus to previous element
    const elementToFocus = returnFocus || previousActiveElement;
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus();
    }

    previousActiveElement = null;
    firstFocusableElement = null;
    lastFocusableElement = null;
  }

  /**
   * Update the focus trap (useful when content changes)
   */
  function update(): void {
    if (!isActive || !container) {
      return;
    }

    const focusableElements = getFocusableElements(container);
    firstFocusableElement = focusableElements[0] || null;
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null;
  }

  return {
    activate,
    deactivate,
    update,
  };
}

