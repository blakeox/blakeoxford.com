/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupScrollEffects, setupScrollBehavior, setupPageTransitions, debounce } from '../../public/assets/js/scroll.js';

describe('Scroll Module', () => {
  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Reset window scroll position
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0
    });

    // Mock requestAnimationFrame
    window.requestAnimationFrame = vi.fn((callback) => {
      callback(Date.now());
      return 1;
    });
  });

  afterEach(() => {
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
      expect(context.updateNavbarOnScroll).toHaveBeenCalled();
      expect(context.ticking).toBe(true); // Should be set during execution
    });

    it('should throttle scroll events with ticking flag', () => {
      const context = {
        ticking: true, // Already ticking
        updateNavbarOnScroll: vi.fn(),
        onScrollEnd: vi.fn()
      };

      setupScrollEffects(context);

      // Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Should not call requestAnimationFrame when already ticking
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
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

      // Simulate scroll up (from higher position to lower)
      Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 50, configurable: true });

      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Fast-forward debounce time
      vi.advanceTimersByTime(50);

      expect(navbar.classList.contains('nav-visible')).toBe(true);
      expect(navbar.classList.contains('nav-hidden')).toBe(false);

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
  });

  describe('setupPageTransitions', () => {
    it('should not setup page transitions if Navigation API is not supported', () => {
      // Mock Navigation API as not available
      Object.defineProperty(window, 'navigation', {
        value: undefined,
        writable: true
      });

      // Reset any previous createElement calls
      vi.clearAllMocks();
      const createElementSpy = vi.spyOn(document, 'createElement');

      setupPageTransitions();

      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should create progress indicator when Navigation API is supported', () => {
      // Mock Navigation API as available
      Object.defineProperty(window, 'navigation', {
        value: {},
        writable: true
      });

      setupPageTransitions();

      const progressIndicator = document.getElementById('page-transition-progress');
      expect(progressIndicator).not.toBeNull();
      expect(progressIndicator?.className).toContain('fixed');
      expect(progressIndicator?.className).toContain('top-0');
      expect(progressIndicator?.className).toContain('left-0');
      expect(progressIndicator?.className).toContain('w-full');
      expect(progressIndicator?.className).toContain('h-1');
    });

    it('should add click event listeners to internal links', () => {
      Object.defineProperty(window, 'navigation', {
        value: {},
        writable: true
      });

      // Create some internal links
      const link1 = document.createElement('a');
      link1.href = '/about';
      link1.textContent = 'About';
      document.body.appendChild(link1);

      const link2 = document.createElement('a');
      link2.href = '/contact';
      link2.textContent = 'Contact';
      document.body.appendChild(link2);

      // Create external link (should be ignored)
      const externalLink = document.createElement('a');
      externalLink.href = 'https://example.com';
      externalLink.target = '_blank';
      document.body.appendChild(externalLink);

      const addEventListenerSpy = vi.spyOn(link1, 'addEventListener');

      setupPageTransitions();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      
      // Function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should cancel previous timeout when called multiple times', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Fast-forward time
      vi.advanceTimersByTime(100);

      // Should only be called once
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should pass arguments correctly', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 123);

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);

      vi.useRealTimers();
    });

    it('should preserve this context', async () => {
      vi.useFakeTimers();
      
      const obj = {
        value: 'test',
        method: function(this: any) {
          return this.value;
        }
      };
      const methodSpy = vi.spyOn(obj, 'method');

      const debouncedMethod = debounce(obj.method.bind(obj), 100);
      debouncedMethod();

      vi.advanceTimersByTime(100);

      expect(methodSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
