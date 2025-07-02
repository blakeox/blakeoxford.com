/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addSkipToContentLink, enhanceFocusManagement } from '../../public/assets/js/a11y.js';

describe('Accessibility Module', () => {
  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addSkipToContentLink', () => {
    it('should add skip to content link if it does not exist', () => {
      // Ensure no existing skip link
      expect(document.getElementById('skip-to-content')).toBeNull();

      addSkipToContentLink();

      const skipLink = document.getElementById('skip-to-content');
      expect(skipLink).not.toBeNull();
      expect(skipLink?.tagName).toBe('A');
      expect(skipLink?.getAttribute('href')).toBe('#main');
      expect(skipLink?.textContent).toBe('Skip to main content');
      expect(skipLink?.className).toContain('sr-only');
      expect(skipLink?.className).toContain('focus:not-sr-only');
    });

    it('should not add duplicate skip to content link if it already exists', () => {
      // Add an existing skip link
      const existingSkipLink = document.createElement('a');
      existingSkipLink.id = 'skip-to-content';
      existingSkipLink.href = '#main';
      existingSkipLink.textContent = 'Existing skip link';
      document.body.appendChild(existingSkipLink);

      addSkipToContentLink();

      // Should still only have one skip link
      const skipLinks = document.querySelectorAll('#skip-to-content');
      expect(skipLinks).toHaveLength(1);
      expect(skipLinks[0].textContent).toBe('Existing skip link');
    });

    it('should insert skip link at the beginning of body', () => {
      // Add some existing content
      const existingDiv = document.createElement('div');
      existingDiv.textContent = 'Existing content';
      document.body.appendChild(existingDiv);

      addSkipToContentLink();

      const skipLink = document.getElementById('skip-to-content');
      expect(skipLink).toBe(document.body.firstChild);
    });

    it('should apply correct CSS classes for accessibility', () => {
      addSkipToContentLink();

      const skipLink = document.getElementById('skip-to-content');
      const classes = skipLink?.className.split(' ') || [];
      
      // Check for essential accessibility classes
      expect(classes).toContain('sr-only');
      expect(classes).toContain('focus:not-sr-only');
      expect(classes).toContain('focus:fixed');
      expect(classes).toContain('focus:top-4');
      expect(classes).toContain('focus:left-4');
      expect(classes).toContain('focus:z-50');
    });
  });

  describe('enhanceFocusManagement', () => {
    let navbar: HTMLElement;
    let trapFocusMock: any;
    let isMenuOpenMock: any;

    beforeEach(() => {
      navbar = document.createElement('nav');
      navbar.setAttribute('data-navbar', '');
      document.body.appendChild(navbar);

      trapFocusMock = vi.fn();
      isMenuOpenMock = vi.fn();
    });

    it('should add keydown event listener to navbar', () => {
      const addEventListenerSpy = vi.spyOn(navbar, 'addEventListener');

      enhanceFocusManagement(navbar, trapFocusMock, isMenuOpenMock);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should call trapFocus when Tab is pressed and menu is open', () => {
      isMenuOpenMock.mockReturnValue(true);
      
      enhanceFocusManagement(navbar, trapFocusMock, isMenuOpenMock);

      // Simulate Tab keydown event
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      navbar.dispatchEvent(tabEvent);

      expect(isMenuOpenMock).toHaveBeenCalled();
      expect(trapFocusMock).toHaveBeenCalledWith(tabEvent);
    });

    it('should not call trapFocus when Tab is pressed but menu is closed', () => {
      isMenuOpenMock.mockReturnValue(false);
      
      enhanceFocusManagement(navbar, trapFocusMock, isMenuOpenMock);

      // Simulate Tab keydown event
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      navbar.dispatchEvent(tabEvent);

      expect(isMenuOpenMock).toHaveBeenCalled();
      expect(trapFocusMock).not.toHaveBeenCalled();
    });

    it('should not call trapFocus when non-Tab key is pressed', () => {
      isMenuOpenMock.mockReturnValue(true);
      
      enhanceFocusManagement(navbar, trapFocusMock, isMenuOpenMock);

      // Simulate Enter keydown event
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      navbar.dispatchEvent(enterEvent);

      expect(isMenuOpenMock).toHaveBeenCalled();
      expect(trapFocusMock).not.toHaveBeenCalled();
    });

    it('should handle Shift+Tab correctly', () => {
      isMenuOpenMock.mockReturnValue(true);
      
      enhanceFocusManagement(navbar, trapFocusMock, isMenuOpenMock);

      // Simulate Shift+Tab keydown event
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      });

      navbar.dispatchEvent(shiftTabEvent);

      expect(isMenuOpenMock).toHaveBeenCalled();
      expect(trapFocusMock).toHaveBeenCalledWith(shiftTabEvent);
    });
  });
});
