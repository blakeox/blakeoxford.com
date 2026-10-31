import { isolateModal } from './modalIsolation';

/**
 * Focus Trap Utility
 *
 * Manages focus trapping within modals, dialogs, and other overlay components.
 * Ensures keyboard users can navigate within the trap and cannot tab outside.
 *
 * Features:
 * - Keyboard focus management for modal dialogs
 * - Tab/Shift+Tab cycling within trap
 * - Prevents focus escape on outside clicks
 * - Supports initial focus, return focus, and fallback focus
 * - Dynamic content updates via update() method
 *
 * @example Basic usage
 * ```typescript
 * import { createFocusTrap } from '@/utils/focusTrap';
 *
 * const containerRef = useRef<HTMLDivElement>(null);
 * const trap = createFocusTrap(containerRef.current);
 *
 * // Activate when modal opens
 * trap.activate();
 *
 * // Deactivate when modal closes
 * trap.deactivate();
 * ```
 *
 * @example With custom focus options
 * ```typescript
 * const trap = createFocusTrap(containerRef.current, {
 *   initialFocus: firstInputRef.current,
 *   returnFocus: triggerButtonRef.current,
 *   fallbackFocus: containerRef.current,
 * });
 * ```
 *
 * @accessibility
 * - Ensures keyboard users cannot accidentally tab outside modal
 * - Maintains logical focus order within trap
 * - Returns focus to triggering element on close
 * - Handles dynamic content changes
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html
 */

/**
 * Candidate focusable element selectors; eligibility is checked against the rendered DOM.
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
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter((el) => {
    if (el.tabIndex < 0 || el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0
    );
  });
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
    modalRoot?: HTMLElement | null;
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

  const { initialFocus = null, returnFocus = null, fallbackFocus = null } = options;

  let previousActiveElement: HTMLElement | null = null;
  let isActive = false;
  let releaseIsolation: (() => void) | undefined;

  /**
   * Handle Tab key to cycle focus within trap
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (
      !isActive ||
      event.defaultPrevented ||
      event.key !== 'Tab' ||
      !container ||
      !container.contains(event.target as Node)
    ) {
      return;
    }

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    // Own the complete modal Tab sequence. WebKit's platform tab preference may
    // otherwise skip buttons and leave the dialog before reaching our boundary.
    event.preventDefault();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex =
      currentIndex < 0
        ? event.shiftKey
          ? focusableElements.length - 1
          : 0
        : (currentIndex + (event.shiftKey ? -1 : 1) + focusableElements.length) %
          focusableElements.length;
    focusableElements[nextIndex]?.focus();
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

    if (options.modalRoot) releaseIsolation = isolateModal(options.modalRoot);

    // Get focusable elements
    const focusableElements = getFocusableElements(container);
    const firstFocusableElement = focusableElements[0] || null;

    // Set initial focus
    const elementToFocus = initialFocus || firstFocusableElement || fallbackFocus || container;
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus();
    }

    // Add event listeners
    // React/inner widgets get to handle Tab (for example title completion) first.
    document.addEventListener('keydown', handleKeyDown);
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
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('click', handleClick, true);

    releaseIsolation?.();
    releaseIsolation = undefined;

    // Return focus to previous element
    const elementToFocus = returnFocus || previousActiveElement;
    if (elementToFocus && typeof elementToFocus.focus === 'function') {
      elementToFocus.focus();
    }

    previousActiveElement = null;
  }

  /**
   * Update the focus trap (useful when content changes)
   */
  function update(): void {
    if (!isActive || !container) {
      return;
    }

    const focusableElements = getFocusableElements(container);
    if (!container.contains(document.activeElement)) {
      (focusableElements[0] || fallbackFocus || container).focus();
    }
  }

  return {
    activate,
    deactivate,
    update,
  };
}
