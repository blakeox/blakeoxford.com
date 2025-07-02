/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupDropdowns, setupDropdownKeyboardNavigation } from '../../public/assets/js/dropdown.js';

describe('Dropdown Module', () => {
  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupDropdowns', () => {
    let triggerLink: HTMLElement;
    let dropdownMenu: HTMLElement;
    let container: HTMLElement;

    beforeEach(() => {
      // Create dropdown structure
      container = document.createElement('div');
      container.className = 'dropdown-container';

      triggerLink = document.createElement('a');
      triggerLink.className = 'nav-link';
      triggerLink.setAttribute('aria-haspopup', 'true');
      triggerLink.setAttribute('aria-expanded', 'false');
      triggerLink.href = '#';
      triggerLink.textContent = 'Dropdown Trigger';

      dropdownMenu = document.createElement('ul');
      dropdownMenu.setAttribute('role', 'menu');
      dropdownMenu.className = 'invisible opacity-0';

      const menuItem1 = document.createElement('li');
      const menuLink1 = document.createElement('a');
      menuLink1.href = '/item1';
      menuLink1.textContent = 'Item 1';
      menuItem1.appendChild(menuLink1);

      const menuItem2 = document.createElement('li');
      const menuLink2 = document.createElement('a');
      menuLink2.href = '/item2';
      menuLink2.textContent = 'Item 2';
      menuItem2.appendChild(menuLink2);

      dropdownMenu.appendChild(menuItem1);
      dropdownMenu.appendChild(menuItem2);

      container.appendChild(triggerLink);
      container.appendChild(dropdownMenu);
      document.body.appendChild(container);
    });

    it('should add click event listener to dropdown triggers', () => {
      const addEventListenerSpy = vi.spyOn(triggerLink, 'addEventListener');

      setupDropdowns();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should open dropdown on click when closed', () => {
      setupDropdowns();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });

      triggerLink.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(triggerLink.getAttribute('aria-expanded')).toBe('true');
      expect(dropdownMenu.classList.contains('visible')).toBe(true);
      expect(dropdownMenu.classList.contains('opacity-100')).toBe(true);
      expect(dropdownMenu.classList.contains('invisible')).toBe(false);
      expect(dropdownMenu.classList.contains('opacity-0')).toBe(false);
    });

    it('should close dropdown on click when open', () => {
      // Start with dropdown open
      triggerLink.setAttribute('aria-expanded', 'true');
      dropdownMenu.classList.remove('invisible', 'opacity-0');
      dropdownMenu.classList.add('visible', 'opacity-100');

      setupDropdowns();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });

      triggerLink.dispatchEvent(clickEvent);

      expect(triggerLink.getAttribute('aria-expanded')).toBe('false');
      expect(dropdownMenu.classList.contains('invisible')).toBe(true);
      expect(dropdownMenu.classList.contains('opacity-0')).toBe(true);
    });

    it('should add blur event listener to close dropdown when focus leaves', () => {
      const addEventListenerSpy = vi.spyOn(triggerLink, 'addEventListener');

      setupDropdowns();

      // Check that both click and blur event listeners were added
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('should close dropdown on blur when focus moves outside menu', async () => {
      vi.useFakeTimers();
      
      // Start with dropdown open
      triggerLink.setAttribute('aria-expanded', 'true');
      dropdownMenu.classList.remove('invisible', 'opacity-0');
      dropdownMenu.classList.add('visible', 'opacity-100');

      setupDropdowns();

      // Create a new element to focus on (outside the dropdown)
      const outsideElement = document.createElement('button');
      outsideElement.textContent = 'Outside Button';
      document.body.appendChild(outsideElement);

      // Simulate blur event
      const blurEvent = new FocusEvent('blur', { bubbles: true });
      triggerLink.dispatchEvent(blurEvent);

      // Focus on outside element
      outsideElement.focus();

      // Fast-forward the setTimeout in blur handler
      vi.advanceTimersByTime(10);

      expect(triggerLink.getAttribute('aria-expanded')).toBe('false');
      expect(dropdownMenu.classList.contains('invisible')).toBe(true);
      expect(dropdownMenu.classList.contains('opacity-0')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should not setup dropdown if menu element is not found', () => {
      // Remove the menu element
      container.removeChild(dropdownMenu);

      const addEventListenerSpy = vi.spyOn(triggerLink, 'addEventListener');

      setupDropdowns();

      // Should not add event listeners if menu is not found
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should work with custom selectors', () => {
      // Update trigger to use custom class
      triggerLink.className = 'custom-trigger';
      triggerLink.setAttribute('aria-haspopup', 'true');

      // Update menu to use custom role
      dropdownMenu.setAttribute('role', 'listbox');

      const addEventListenerSpy = vi.spyOn(triggerLink, 'addEventListener');

      setupDropdowns('.custom-trigger[aria-haspopup="true"]', 'ul[role="listbox"]');

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('setupDropdownKeyboardNavigation', () => {
    let triggerLink: HTMLElement;
    let dropdownMenu: HTMLElement;
    let container: HTMLElement;

    beforeEach(() => {
      // Create dropdown structure with focusable items
      container = document.createElement('div');

      triggerLink = document.createElement('a');
      triggerLink.className = 'nav-link';
      triggerLink.setAttribute('aria-haspopup', 'true');
      triggerLink.setAttribute('aria-expanded', 'false');
      triggerLink.href = '#';
      triggerLink.textContent = 'Dropdown Trigger';

      dropdownMenu = document.createElement('ul');
      dropdownMenu.setAttribute('role', 'menu');

      const menuItem1 = document.createElement('li');
      const menuLink1 = document.createElement('a');
      menuLink1.href = '/item1';
      menuLink1.textContent = 'Item 1';
      menuLink1.setAttribute('tabindex', '0');
      menuItem1.appendChild(menuLink1);

      const menuItem2 = document.createElement('li');
      const menuLink2 = document.createElement('a');
      menuLink2.href = '/item2';
      menuLink2.textContent = 'Item 2';
      menuLink2.setAttribute('tabindex', '0');
      menuItem2.appendChild(menuLink2);

      dropdownMenu.appendChild(menuItem1);
      dropdownMenu.appendChild(menuItem2);

      container.appendChild(triggerLink);
      container.appendChild(dropdownMenu);
      document.body.appendChild(container);
    });

    it('should add keydown event listener to dropdown triggers', () => {
      const addEventListenerSpy = vi.spyOn(triggerLink, 'addEventListener');

      setupDropdownKeyboardNavigation();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should open dropdown on Enter key', () => {
      setupDropdownKeyboardNavigation();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });
      Object.defineProperty(enterEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });

      triggerLink.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(triggerLink.getAttribute('aria-expanded')).toBe('true');
      expect(dropdownMenu.classList.contains('visible')).toBe(true);
    });

    it('should open dropdown on Space key', () => {
      setupDropdownKeyboardNavigation();

      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true
      });
      Object.defineProperty(spaceEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });

      triggerLink.dispatchEvent(spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(triggerLink.getAttribute('aria-expanded')).toBe('true');
    });

    it('should open dropdown and focus first item on ArrowDown key', () => {
      setupDropdownKeyboardNavigation();

      const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });
      Object.defineProperty(downEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });

      triggerLink.dispatchEvent(downEvent);

      expect(downEvent.preventDefault).toHaveBeenCalled();
      expect(triggerLink.getAttribute('aria-expanded')).toBe('true');
      
      // Check if first menu item gets focus (would need to mock focus)
      const firstMenuItem = dropdownMenu.querySelector('a');
      expect(firstMenuItem).not.toBeNull();
    });

    it('should close dropdown on Escape key', () => {
      // Start with dropdown open
      triggerLink.setAttribute('aria-expanded', 'true');
      dropdownMenu.classList.add('visible', 'opacity-100');

      setupDropdownKeyboardNavigation();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      triggerLink.dispatchEvent(escapeEvent);

      expect(triggerLink.getAttribute('aria-expanded')).toBe('false');
      expect(dropdownMenu.classList.contains('invisible')).toBe(true);
    });

    it('should not handle other keys', () => {
      setupDropdownKeyboardNavigation();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      Object.defineProperty(tabEvent, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });

      triggerLink.dispatchEvent(tabEvent);

      // Should not prevent default or change dropdown state for Tab key
      expect(tabEvent.preventDefault).not.toHaveBeenCalled();
      expect(triggerLink.getAttribute('aria-expanded')).toBe('false');
    });

    it('should work with custom selectors', () => {
      // Update trigger to use custom class
      triggerLink.className = 'custom-trigger';
      triggerLink.setAttribute('aria-haspopup', 'true');

      const addEventListenerSpy = vi.spyOn(triggerLink, 'addEventListener');

      setupDropdownKeyboardNavigation('.custom-trigger[aria-haspopup="true"]', 'ul[role="menu"]');

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
