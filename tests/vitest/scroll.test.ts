/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jsdom" />
/// <reference lib="dom" />

// Declare globals for TypeScript
declare global {
  const window: Window & typeof globalThis;
  const document: Document;
  const Event: typeof window.Event;
  const MouseEvent: typeof window.MouseEvent;
  const HTMLElement: typeof window.HTMLElement;
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupScrollEffects, setupScrollBehavior, setupPageTransitions } from '../../assets-source/js/scroll.js';

describe('Scroll Module', () => {
  let registeredListeners: Array<{event: string, listener: any, options?: any}> = [];

  beforeEach(() => {
    // Restore all mocks first to prevent interference
    vi.restoreAllMocks();
    
    // Clear the DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Clear registered listeners tracking
    registeredListeners = [];
    
    // Reset window scroll position
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0
    });

    // Reset document scroll position
    Object.defineProperty(document.documentElement, 'scrollTop', {
      writable: true,
      configurable: true,
      value: 0
    });

    // Mock addEventListener to track registered listeners
    const originalAddEventListener = window.addEventListener.bind(window);
    window.addEventListener = vi.fn((event, listener, options) => {
      registeredListeners.push({ event, listener, options });
      return originalAddEventListener(event, listener, options);
    });

    // Mock requestAnimationFrame - this will be overridden by specific tests as needed
    window.requestAnimationFrame = vi.fn((callback) => {
      callback(Date.now());
      return 1;
    });
  });

  afterEach(() => {
    // Remove all registered event listeners
    registeredListeners.forEach(({ event, listener, options }) => {
      window.removeEventListener(event, listener, options);
    });
    registeredListeners = [];
    
    vi.restoreAllMocks();
  });

  describe('setupScrollEffects', () => {
    it('should add scroll event listener to window', () => {
      const context = {
        ticking: false,
        updateNavbarOnScroll: vi.fn(),
        onScrollEnd: vi.fn()
      };

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      setupScrollEffects(context);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should call updateNavbarOnScroll through requestAnimationFrame', () => {
      const context = {
        ticking: false,
        updateNavbarOnScroll: vi.fn(),
        onScrollEnd: vi.fn()
      };

      setupScrollEffects(context);

      // Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      expect(window.requestAnimationFrame).toHaveBeenCalled();
      
      // Execute the requestAnimationFrame callback manually
      const rafCallback = vi.mocked(window.requestAnimationFrame).mock.calls[0][0];
      rafCallback(16.67); // Simulate timestamp
      
      expect(context.updateNavbarOnScroll).toHaveBeenCalled();
    });

    it('should throttle scroll events with ticking flag', () => {
      // Create a fresh spy for requestAnimationFrame without auto-execution
      const rafSpy = vi.fn();
      window.requestAnimationFrame = rafSpy;
      
      const context = {
        ticking: true, // Already ticking
        updateNavbarOnScroll: vi.fn(),
        onScrollEnd: vi.fn()
      };

      // Set up the scroll effects fresh
      setupScrollEffects(context);

      // Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Should not call requestAnimationFrame when already ticking
      expect(rafSpy).not.toHaveBeenCalled();
      expect(context.updateNavbarOnScroll).not.toHaveBeenCalled();
    });

    it('should call onScrollEnd after scroll timeout', async () => {
      vi.useFakeTimers();
      
      const context = {
        ticking: false,
        updateNavbarOnScroll: vi.fn(),
        onScrollEnd: vi.fn()
      };

      setupScrollEffects(context);

      // Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(150);

      expect(context.onScrollEnd).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('setupScrollBehavior', () => {
    let navbar: HTMLElement;

    beforeEach(() => {
      navbar = document.createElement('nav');
      navbar.classList.add('navbar');
      document.body.appendChild(navbar);
    });

    it('should not setup scroll behavior if navbar is null', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      setupScrollBehavior(null as any);

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should add scroll event listener when navbar exists', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      setupScrollBehavior(navbar);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should hide navbar when scrolling down past threshold', () => {
      vi.useFakeTimers();
      setupScrollBehavior(navbar);

      // Simulate scroll down
      Object.defineProperty(window, 'scrollY', { value: 200 });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 200 });

      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Fast-forward debounce time
      vi.advanceTimersByTime(50);

      expect(navbar.classList.contains('nav-hidden')).toBe(true);
      expect(navbar.classList.contains('nav-visible')).toBe(false);

      vi.useRealTimers();
    });

    it('should show navbar when scrolling up', () => {
      vi.useFakeTimers();
      
      // Start with navbar hidden (simulate previous scroll down)
      navbar.classList.add('nav-hidden');
      
      setupScrollBehavior(navbar);

      // Mock scroll position to simulate scroll up 
      // Store original values to restore later
      const originalScrollY = (window as any).scrollY;
      const originalScrollTop = (document.documentElement as any).scrollTop;
      
      // Set scroll position that will trigger navbar show
      (window as any).scrollY = 50;
      (document.documentElement as any).scrollTop = 50;

      const scrollEvent = new Event('scroll');
      (window as any).dispatchEvent(scrollEvent);

      // Fast-forward debounce time
      vi.advanceTimersByTime(50);

      expect(navbar.classList.contains('nav-visible')).toBe(true);
      expect(navbar.classList.contains('nav-hidden')).toBe(false);

      // Restore original values
      (window as any).scrollY = originalScrollY;
      (document.documentElement as any).scrollTop = originalScrollTop;

      vi.useRealTimers();
    });

    it('should not change navbar visibility for small scroll changes', () => {
      vi.useFakeTimers();
      setupScrollBehavior(navbar);

      // Simulate small scroll change (below threshold of 50px)
      Object.defineProperty(window, 'scrollY', { value: 30, configurable: true });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 30, configurable: true });

      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Fast-forward debounce time
      vi.advanceTimersByTime(50);

      // Should not add hidden or visible classes for small changes
      expect(navbar.classList.contains('nav-hidden')).toBe(false);
      expect(navbar.classList.contains('nav-visible')).toBe(false);

      vi.useRealTimers();
    });

    it('should not update navbar when scroll difference is below threshold', () => {
      vi.useFakeTimers();
      
      setupScrollBehavior(navbar);

      // Start with a small scroll position to set lastScrollTop
      Object.defineProperty(window, 'scrollY', { value: 150 });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 150 });

      const scrollEvent1 = new Event('scroll');
      window.dispatchEvent(scrollEvent1);
      vi.advanceTimersByTime(60); // Process first scroll

      // Now make a small scroll change (below 50px threshold)  
      // Change from 150 to 170 = 20px difference, below threshold of 50
      Object.defineProperty(window, 'scrollY', { value: 170 });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 170 });

      // Clear any existing classes before the test
      navbar.classList.remove('nav-hidden', 'nav-visible');
      
      const scrollEvent2 = new Event('scroll');
      window.dispatchEvent(scrollEvent2);

      // Fast-forward through debounce
      vi.advanceTimersByTime(60);

      // Navbar classes should not change because scroll difference is below threshold
      expect(navbar.classList.contains('nav-hidden')).toBe(false);
      expect(navbar.classList.contains('nav-visible')).toBe(false);

      vi.useRealTimers();
    });

    it('should use documentElement.scrollTop when window.scrollY is unavailable', () => {
      vi.useFakeTimers();
      
      setupScrollBehavior(navbar);

      // Mock window.scrollY as undefined to test fallback
      Object.defineProperty(window, 'scrollY', { value: undefined });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 200 });

      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Fast-forward through debounce
      vi.advanceTimersByTime(60);

      // Should use documentElement.scrollTop and hide navbar (200 > 100 and scrolling down from 0)
      expect(navbar.classList.contains('nav-hidden')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('setupPageTransitions', () => {
    beforeEach(() => {
      // Mock window.navigation
      Object.defineProperty(window, 'navigation', {
        value: {},
        configurable: true
      });
      
      // Clear DOM
      document.body.innerHTML = '';
      
      // Mock location.href setter
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true
      });
    });

    it('should return early if navigation API is not supported', () => {
      // Remove navigation API
      delete (window as any).navigation;
      
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      setupPageTransitions();
      
      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should create progress indicator element', () => {
      setupPageTransitions();
      
      const indicator = document.getElementById('page-transition-progress');
      expect(indicator).toBeTruthy();
      expect(indicator?.className).toBe('fixed top-0 left-0 w-full h-1 bg-transparent z-50');
    });

    it('should add event listeners to internal links', () => {
      // Create internal links
      const link1 = document.createElement('a');
      link1.href = '/about';
      link1.textContent = 'About';
      
      const link2 = document.createElement('a');
      link2.href = '/contact';
      link2.textContent = 'Contact';
      
      document.body.appendChild(link1);
      document.body.appendChild(link2);
      
      const addEventListenerSpy = vi.spyOn(link1, 'addEventListener');
      
      setupPageTransitions();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should ignore external links', () => {
      // Create external link with target="_blank"
      const externalLink = document.createElement('a');
      externalLink.href = '/external';
      externalLink.setAttribute('target', '_blank');
      document.body.appendChild(externalLink);
      
      const addEventListenerSpy = vi.spyOn(externalLink, 'addEventListener');
      
      setupPageTransitions();
      
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should not prevent default for modifier key clicks', () => {
      const link = document.createElement('a');
      link.href = '/test';
      document.body.appendChild(link);
      
      setupPageTransitions();
      
      // Test metaKey
      const metaEvent = new MouseEvent('click', { metaKey: true, bubbles: true });
      const metaPreventDefaultSpy = vi.spyOn(metaEvent, 'preventDefault');
      link.dispatchEvent(metaEvent);
      expect(metaPreventDefaultSpy).not.toHaveBeenCalled();
      
      // Test ctrlKey
      const ctrlEvent = new MouseEvent('click', { ctrlKey: true, bubbles: true });
      const ctrlPreventDefaultSpy = vi.spyOn(ctrlEvent, 'preventDefault');
      link.dispatchEvent(ctrlEvent);
      expect(ctrlPreventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not prevent default for download links', () => {
      const link = document.createElement('a');
      link.href = '/document.pdf';
      link.setAttribute('download', '');
      document.body.appendChild(link);
      
      setupPageTransitions();
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      link.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not prevent default for hash links', () => {
      const link = document.createElement('a');
      link.href = '/page#section';
      document.body.appendChild(link);
      
      setupPageTransitions();
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      link.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not prevent default for links with target attribute', () => {
      const link = document.createElement('a');
      link.href = '/page';
      link.setAttribute('target', '_self');
      document.body.appendChild(link);
      
      setupPageTransitions();
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      link.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle page transition on valid internal link click', () => {
      vi.useFakeTimers();
      
      // Mock location assignment to avoid JSDOM navigation issues
      const mockLocationAssign = vi.fn();
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          assign: mockLocationAssign,
          href: 'http://localhost:3000/'
        },
        writable: true,
        configurable: true
      });
      
      const link = document.createElement('a');
      link.href = '/test-page';
      document.body.appendChild(link);
      
      setupPageTransitions();
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      
      link.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.body.classList.contains('page-transition-exit')).toBe(true);
      
      // Check progress indicator styling
      const indicator = document.getElementById('page-transition-progress');
      expect(indicator?.style.opacity).toBe('1');
      expect(indicator?.style.width).toBe('0%');
      
      // Fast-forward timers to test progress updates
      vi.advanceTimersByTime(10);
      expect(indicator?.style.width).toBe('60%');
      
      vi.advanceTimersByTime(150);
      expect(indicator?.style.width).toBe('80%');
      
      // Since we can't easily mock the href setter in JSDOM,
      // we'll just verify the timer behavior and visual feedback
      vi.advanceTimersByTime(250);
      
      vi.useRealTimers();
    });

    it('should handle pageshow event', () => {
      vi.useFakeTimers();
      
      setupPageTransitions();
      
      // Trigger pageshow event
      const pageshowEvent = new Event('pageshow');
      window.dispatchEvent(pageshowEvent);
      
      expect(document.body.classList.contains('page-transition-enter')).toBe(true);
      
      const indicator = document.getElementById('page-transition-progress');
      expect(indicator?.style.width).toBe('100%');
      expect(indicator?.style.transition).toBe('width 200ms ease-out');
      
      // Fast-forward to opacity transition
      vi.advanceTimersByTime(200);
      expect(indicator?.style.opacity).toBe('0');
      
      // Fast-forward to class removal
      vi.advanceTimersByTime(300);
      expect(document.body.classList.contains('page-transition-enter')).toBe(false);
      
      vi.useRealTimers();
    });

    it('should handle missing progress indicator gracefully', () => {
      const link = document.createElement('a');
      link.href = '/test';
      document.body.appendChild(link);
      
      setupPageTransitions();
      
      // Remove the indicator before clicking
      const indicator = document.getElementById('page-transition-progress');
      indicator?.remove();
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      // Should not throw when indicator is missing
      expect(() => link.dispatchEvent(clickEvent)).not.toThrow();
    });
  });

});
