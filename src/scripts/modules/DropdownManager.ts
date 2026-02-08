/**
 * Dropdown Manager - TypeScript version
 * Handles dropdown menus with keyboard navigation and ARIA support
 */

import type { FocusTrap } from '../../types/core';
import type { DropdownConfig, DropdownState } from '../../types/dropdown';

export class DropdownManager {
  private dropdowns: Map<HTMLElement, DropdownState> = new Map();
  private config: DropdownConfig;
  private globalClickHandler: ((e: Event) => void) | null = null;
  private globalKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: DropdownConfig = {
    triggerSelector: '.nav-link[aria-haspopup="true"]',
    menuSelector: 'ul[role="menu"]',
    autoClose: true,
    keyboardNavigation: true,
    enabled: true
  }) {
    this.config = config;
    this.init();
  }

  private init(): void {
    this.setupDropdowns();
    this.setupGlobalEventHandlers();
  }

  private setupDropdowns(): void {
    const triggers = document.querySelectorAll<HTMLElement>(this.config.triggerSelector);
    
    triggers.forEach(trigger => {
      const menu = trigger.parentElement?.querySelector<HTMLElement>(this.config.menuSelector);
      if (!menu) return;

      const state: DropdownState = {
        isOpen: false,
        trigger,
        menu,
        focusTrap: null
      };

      this.dropdowns.set(trigger, state);
      this.setupDropdownEventHandlers(state);
    });

    console.log(`🎯 DropdownManager: Setup ${this.dropdowns.size} dropdowns`);
  }

  private setupDropdownEventHandlers(state: DropdownState): void {
    const { trigger, menu } = state;

    // Trigger click handler
    trigger.addEventListener('click', (e: Event) => {
      e.preventDefault();
      this.toggleDropdown(state);
    });

    // Trigger blur handler
    trigger.addEventListener('blur', () => {
      const blurDelay = (typeof window !== 'undefined' && (((typeof location !== 'undefined') && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) || (typeof navigator !== 'undefined' && (navigator as any).webdriver))) ? 0 : 100;
      setTimeout(() => {
        if (!menu.contains(document.activeElement) && document.activeElement !== trigger) {
          this.closeDropdown(state);
        }
      }, blurDelay);
    });

    // Setup keyboard navigation if enabled
    if (this.config.keyboardNavigation) {
      this.setupKeyboardNavigation(state);
    }
  }

  private setupKeyboardNavigation(state: DropdownState): void {
    const { trigger, menu } = state;

    // Trigger keyboard navigation
    trigger.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openDropdown(state);
        const firstItem = menu.querySelector<HTMLElement>('a, button');
        if (firstItem) firstItem.focus();
      } else if (e.key === 'Escape') {
        this.closeDropdown(state);
        trigger.focus();
      }
    });

    // Menu keyboard navigation
    menu.addEventListener('keydown', (e: KeyboardEvent) => {
      const items = Array.from(menu.querySelectorAll<HTMLElement>('a, button'));
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = (currentIndex + 1) % items.length;
          items[next].focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = (currentIndex - 1 + items.length) % items.length;
          items[prev].focus();
          break;
        }
        case 'Escape': {
          this.closeDropdown(state);
          trigger.focus();
          break;
        }
        case 'Tab': {
          // Let Tab work normally for accessibility
          break;
        }
      }
    });
  }

  private setupGlobalEventHandlers(): void {
    if (this.config.autoClose) {
      this.globalClickHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        this.dropdowns.forEach((state) => {
          if (!state.trigger.contains(target) && !state.menu.contains(target)) {
            this.closeDropdown(state);
          }
        });
      };

      document.addEventListener('click', this.globalClickHandler);
    }

    // Global escape key handler
    this.globalKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    };

    document.addEventListener('keydown', this.globalKeyHandler);
  }

  private toggleDropdown(state: DropdownState): void {
    if (state.isOpen) {
      this.closeDropdown(state);
    } else {
      this.openDropdown(state);
    }
  }

  private openDropdown(state: DropdownState): void {
    // Close all other dropdowns first
    this.closeAllDropdowns();

    state.isOpen = true;
    state.trigger.setAttribute('aria-expanded', 'true');
    state.menu.classList.remove('invisible', 'opacity-0');
    state.menu.classList.add('visible', 'opacity-100');

    // Create focus trap
    state.focusTrap = this.createFocusTrap(state.menu);
    state.focusTrap.activate();

    // Announce to screen readers
    this.announceToScreenReader('Dropdown menu opened');
  }

  private closeDropdown(state: DropdownState): void {
    state.isOpen = false;
    state.trigger.setAttribute('aria-expanded', 'false');
    state.menu.classList.add('invisible', 'opacity-0');
    state.menu.classList.remove('visible', 'opacity-100');

    // Deactivate focus trap
    if (state.focusTrap) {
      state.focusTrap.deactivate();
      state.focusTrap = null;
    }
  }

  private createFocusTrap(element: HTMLElement): FocusTrap {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    if (focusableElements.length === 0) {
      return {
        activate: () => {},
        deactivate: () => {},
        handleKeyDown: () => {}
      };
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return {
      activate: () => firstElement.focus(),
      deactivate: () => element.removeEventListener('keydown', handleKeyDown),
      handleKeyDown
    };
  }

  public closeAllDropdowns(): void {
    this.dropdowns.forEach((state) => {
      if (state.isOpen) {
        this.closeDropdown(state);
      }
    });
  }

  public addDropdown(trigger: HTMLElement, menu: HTMLElement): void {
    const state: DropdownState = {
      isOpen: false,
      trigger,
      menu,
      focusTrap: null
    };

    this.dropdowns.set(trigger, state);
    this.setupDropdownEventHandlers(state);
  }

  public removeDropdown(trigger: HTMLElement): void {
    const state = this.dropdowns.get(trigger);
    if (state && state.isOpen) {
      this.closeDropdown(state);
    }
    this.dropdowns.delete(trigger);
  }

  public getDropdownState(trigger: HTMLElement): DropdownState | undefined {
    return this.dropdowns.get(trigger);
  }

  public isDropdownOpen(trigger: HTMLElement): boolean {
    const state = this.dropdowns.get(trigger);
    return state?.isOpen || false;
  }

  public updateConfig(newConfig: Partial<DropdownConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if needed
    if (newConfig.triggerSelector || newConfig.menuSelector) {
      this.cleanup();
      this.init();
    }
  }

  private announceToScreenReader(message: string): void {
    if (window.accessibilityModule) {
      window.accessibilityModule.announce(message, 'polite');
    }
  }

  private cleanup(): void {
    // Remove global event handlers
    if (this.globalClickHandler) {
      document.removeEventListener('click', this.globalClickHandler);
    }
    if (this.globalKeyHandler) {
      document.removeEventListener('keydown', this.globalKeyHandler);
    }

    // Close all dropdowns
    this.closeAllDropdowns();

    // Clear dropdowns map
    this.dropdowns.clear();
  }

  public destroy(): void {
    this.cleanup();
  }
}

// Initialize dropdown manager
export function initDropdownManager(config?: DropdownConfig): DropdownManager {
  console.log('🚀 Initializing DropdownManager...');
  return new DropdownManager(config);
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      (window as Window & { dropdownManager?: DropdownManager }).dropdownManager = initDropdownManager();
    });
  } else {
    (window as Window & { dropdownManager?: DropdownManager }).dropdownManager = initDropdownManager();
  }
} 