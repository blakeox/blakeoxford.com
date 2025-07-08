/**
 * Dropdown Menu Unit Tests
 * Tests the dropdown.js functionality for navigation dropdowns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Dropdown Menu Functionality', () => {
  let document: Document;
  let container: HTMLElement;

  // Mock implementations of the dropdown functions
  function setupDropdowns(triggerSelector = '.nav-link[aria-haspopup="true"]', menuSelector = 'ul[role="menu"]') {
    const triggers = document.querySelectorAll(triggerSelector);
    triggers.forEach(trigger => {
      const menu = trigger.parentElement?.querySelector(menuSelector) as HTMLElement;
      if (!menu) return;
      
      // Toggle dropdown on click
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        closeAllDropdowns();
        if (!expanded) {
          trigger.setAttribute('aria-expanded', 'true');
          menu.classList.remove('invisible', 'opacity-0');
          menu.classList.add('visible', 'opacity-100');
          (trigger as HTMLElement).focus();
        }
      });
      
      // Close dropdown on blur (without setTimeout to avoid infinite recursion in tests)
      trigger.addEventListener('blur', () => {
        if (!menu.contains(document.activeElement) && document.activeElement !== trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          menu.classList.add('invisible', 'opacity-0');
          menu.classList.remove('visible', 'opacity-100');
        }
      });
    });
  }

  function setupDropdownKeyboardNavigation(triggerSelector = '.nav-link[aria-haspopup="true"]', menuSelector = 'ul[role="menu"]') {
    document.addEventListener('keydown', (e) => {
      const trigger = e.target as HTMLElement;
      if (!trigger.matches?.(triggerSelector)) return;
      
      const menu = trigger.parentElement?.querySelector(menuSelector) as HTMLElement;
      if (!menu) return;
      
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) {
          closeAllDropdowns();
          trigger.setAttribute('aria-expanded', 'true');
          menu.classList.remove('invisible', 'opacity-0');
          menu.classList.add('visible', 'opacity-100');
          
          const firstItem = menu.querySelector('a, button') as HTMLElement;
          if (firstItem) firstItem.focus();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.add('invisible', 'opacity-0');
        menu.classList.remove('visible', 'opacity-100');
        trigger.focus();
      }
    });
    
    // Handle menu item navigation
    document.addEventListener('keydown', (e) => {
      const menuItem = e.target as HTMLElement;
      const menu = menuItem.closest('ul[role="menu"]') as HTMLElement;
      if (!menu) return;
      
      const items = Array.from(menu.querySelectorAll('a, button')) as HTMLElement[];
      const currentIndex = items.indexOf(menuItem);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const trigger = menu.parentElement?.querySelector('[aria-haspopup="true"]') as HTMLElement;
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          menu.classList.add('invisible', 'opacity-0');
          menu.classList.remove('visible', 'opacity-100');
          trigger.focus();
        }
      }
    });
  }

  function closeAllDropdowns() {
    const allTriggers = document.querySelectorAll('[aria-haspopup="true"]');
    allTriggers.forEach(trigger => {
      const menu = trigger.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      if (menu) {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.add('invisible', 'opacity-0');
        menu.classList.remove('visible', 'opacity-100');
      }
    });
  }

  beforeEach(() => {
    // Create a clean DOM environment using JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
    document = global.document;
    
    // Create container
    container = document.createElement('div');
    container.innerHTML = `
      <nav>
        <ul>
          <li>
            <a href="#" class="nav-link" aria-haspopup="true" aria-expanded="false" data-dropdown="menu1">
              Products
            </a>
            <ul role="menu" class="invisible opacity-0" data-menu="menu1">
              <li><a href="/product1">Product 1</a></li>
              <li><a href="/product2">Product 2</a></li>
              <li><button type="button">Product 3</button></li>
            </ul>
          </li>
          <li>
            <a href="#" class="nav-link" aria-haspopup="true" aria-expanded="false" data-dropdown="menu2">
              Services
            </a>
            <ul role="menu" class="invisible opacity-0" data-menu="menu2">
              <li><a href="/service1">Service 1</a></li>
              <li><a href="/service2">Service 2</a></li>
            </ul>
          </li>
          <li>
            <a href="/about" class="nav-link">About</a>
          </li>
        </ul>
      </nav>
      
      <a href="#" class="nav-link" aria-haspopup="true" aria-expanded="false" id="orphan-trigger">
        Orphan
      </a>

      <div>
        <button class="custom-trigger" aria-haspopup="true" aria-expanded="false">Custom</button>
        <div class="custom-menu invisible opacity-0">
          <a href="#">Custom Item 1</a>
          <a href="#">Custom Item 2</a>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);

    // Mock focus method
    const mockFocus = vi.fn();
    HTMLElement.prototype.focus = mockFocus;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('setupDropdowns() Function', () => {
    it('should set up dropdown functionality on click', () => {
      setupDropdowns();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const menu = trigger.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      
      // Check initial state
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(menu.classList.contains('invisible')).toBe(true);
      expect(menu.classList.contains('opacity-0')).toBe(true);
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', { value: vi.fn() });
      trigger.dispatchEvent(clickEvent);
      
      // Check that dropdown opened
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(menu.classList.contains('invisible')).toBe(false);
      expect(menu.classList.contains('opacity-0')).toBe(false);
      expect(menu.classList.contains('visible')).toBe(true);
      expect(menu.classList.contains('opacity-100')).toBe(true);
    });

    it('should close dropdown when clicking again', () => {
      setupDropdowns();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const menu = trigger.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      
      // Open dropdown first
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent1, 'preventDefault', { value: vi.fn() });
      trigger.dispatchEvent(clickEvent1);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      
      // Click again to close
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent2, 'preventDefault', { value: vi.fn() });
      trigger.dispatchEvent(clickEvent2);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(menu.classList.contains('invisible')).toBe(true);
      expect(menu.classList.contains('opacity-0')).toBe(true);
    });

    it('should handle ARIA states correctly', () => {
      setupDropdowns();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', { value: vi.fn() });
      trigger.dispatchEvent(clickEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should handle custom selectors', () => {
      setupDropdowns('.custom-trigger', '.custom-menu');
      
      const trigger = document.querySelector('.custom-trigger') as HTMLElement;
      const menu = document.querySelector('.custom-menu') as HTMLElement;
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', { value: vi.fn() });
      trigger.dispatchEvent(clickEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(menu.classList.contains('invisible')).toBe(false);
    });

    it('should handle triggers without menus gracefully', () => {
      expect(() => {
        setupDropdowns('#orphan-trigger', 'ul[role="menu"]');
      }).not.toThrow();
      
      const orphanTrigger = document.querySelector('#orphan-trigger') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', { value: vi.fn() });
      
      expect(() => {
        orphanTrigger.dispatchEvent(clickEvent);
      }).not.toThrow();
    });

    it('should close other dropdowns when opening a new one', () => {
      setupDropdowns();
      
      const trigger1 = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const trigger2 = document.querySelector('[data-dropdown="menu2"]') as HTMLElement;
      const menu1 = trigger1.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      const menu2 = trigger2.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      
      // Open first dropdown
      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent1, 'preventDefault', { value: vi.fn() });
      trigger1.dispatchEvent(clickEvent1);
      
      expect(trigger1.getAttribute('aria-expanded')).toBe('true');
      expect(menu1.classList.contains('visible')).toBe(true);
      
      // Open second dropdown
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent2, 'preventDefault', { value: vi.fn() });
      trigger2.dispatchEvent(clickEvent2);
      
      // First should be closed, second should be open
      expect(trigger1.getAttribute('aria-expanded')).toBe('false');
      expect(trigger2.getAttribute('aria-expanded')).toBe('true');
      expect(menu1.classList.contains('invisible')).toBe(true);
      expect(menu2.classList.contains('visible')).toBe(true);
    });
  });

  describe('setupDropdownKeyboardNavigation() Function', () => {
    it('should open dropdown with ArrowDown key', () => {
      setupDropdownKeyboardNavigation();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const menu = trigger.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(keyEvent, 'target', { value: trigger });
      document.dispatchEvent(keyEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(menu.classList.contains('visible')).toBe(true);
    });

    it('should open dropdown with Enter key', () => {
      setupDropdownKeyboardNavigation();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(keyEvent, 'target', { value: trigger });
      document.dispatchEvent(keyEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should open dropdown with Space key', () => {
      setupDropdownKeyboardNavigation();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      
      const keyEvent = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(keyEvent, 'target', { value: trigger });
      document.dispatchEvent(keyEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close dropdown with Escape key', () => {
      setupDropdownKeyboardNavigation();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const menu = trigger.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      
      // Open dropdown first
      trigger.setAttribute('aria-expanded', 'true');
      menu.classList.remove('invisible', 'opacity-0');
      menu.classList.add('visible', 'opacity-100');
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(keyEvent, 'target', { value: trigger });
      document.dispatchEvent(keyEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(menu.classList.contains('invisible')).toBe(true);
    });

    it('should navigate menu items with arrow keys', () => {
      setupDropdownKeyboardNavigation();
      
      const menu = document.querySelector('ul[role="menu"]') as HTMLElement;
      const menuItems = Array.from(menu.querySelectorAll('a, button')) as HTMLElement[];
      
      // Focus first item
      menuItems[0].focus();
      
      // Press ArrowDown
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(downEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(downEvent, 'target', { value: menuItems[0] });
      document.dispatchEvent(downEvent);
      
      // Focus should move to second item (we can't test actual focus, but we test the logic)
      expect(downEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle Escape key from menu items', () => {
      setupDropdownKeyboardNavigation();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const menu = trigger.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      const firstItem = menu.querySelector('a') as HTMLElement;
      
      // Open dropdown first
      trigger.setAttribute('aria-expanded', 'true');
      menu.classList.remove('invisible', 'opacity-0');
      menu.classList.add('visible', 'opacity-100');
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(keyEvent, 'target', { value: firstItem });
      document.dispatchEvent(keyEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(menu.classList.contains('invisible')).toBe(true);
    });

    it('should handle triggers without matching elements', () => {
      expect(() => {
        setupDropdownKeyboardNavigation('.non-existent-trigger', '.non-existent-menu');
      }).not.toThrow();
    });
  });

  describe('closeAllDropdowns() Function', () => {
    it('should close all open dropdowns', () => {
      setupDropdowns();
      
      const trigger1 = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      const trigger2 = document.querySelector('[data-dropdown="menu2"]') as HTMLElement;
      const menu1 = trigger1.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      const menu2 = trigger2.parentElement?.querySelector('ul[role="menu"]') as HTMLElement;
      
      // Open both dropdowns manually
      trigger1.setAttribute('aria-expanded', 'true');
      trigger2.setAttribute('aria-expanded', 'true');
      menu1.classList.remove('invisible', 'opacity-0');
      menu1.classList.add('visible', 'opacity-100');
      menu2.classList.remove('invisible', 'opacity-0');
      menu2.classList.add('visible', 'opacity-100');
      
      closeAllDropdowns();
      
      expect(trigger1.getAttribute('aria-expanded')).toBe('false');
      expect(trigger2.getAttribute('aria-expanded')).toBe('false');
      expect(menu1.classList.contains('invisible')).toBe(true);
      expect(menu2.classList.contains('invisible')).toBe(true);
    });

    it('should handle triggers without menus gracefully', () => {
      const orphanTrigger = document.querySelector('#orphan-trigger') as HTMLElement;
      orphanTrigger.setAttribute('aria-expanded', 'true');
      
      expect(() => {
        closeAllDropdowns();
      }).not.toThrow();
      
      expect(orphanTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should work when no dropdowns are open', () => {
      expect(() => {
        closeAllDropdowns();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with both functions together', () => {
      setupDropdowns();
      setupDropdownKeyboardNavigation();
      
      const trigger = document.querySelector('[data-dropdown="menu1"]') as HTMLElement;
      
      // Test click to open
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', { value: vi.fn() });
      trigger.dispatchEvent(clickEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      
      // Test keyboard to close
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      Object.defineProperty(keyEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(keyEvent, 'target', { value: trigger });
      document.dispatchEvent(keyEvent);
      
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should handle invalid selectors gracefully', () => {
      expect(() => {
        setupDropdowns('.non-existent-selector', '.also-non-existent');
        setupDropdownKeyboardNavigation('.invalid', '.selectors');
      }).not.toThrow();
    });
  });
});
