// Isolated test to debug the throttling issue
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupScrollEffects } from './assets-source/js/scroll.js';

describe('Scroll Throttling Test', () => {
  beforeEach(() => {
    // Create a fresh mock for requestAnimationFrame
    global.window = {
      addEventListener: vi.fn(),
      requestAnimationFrame: vi.fn(),
      dispatchEvent: vi.fn()
    };
    global.document = {
      body: { innerHTML: '' },
      head: { innerHTML: '' }
    };
  });

  it('should throttle scroll events with ticking flag', () => {
    const rafSpy = vi.fn();
    window.requestAnimationFrame = rafSpy;
    
    const context = {
      ticking: true, // Already ticking
      updateNavbarOnScroll: vi.fn(),
      onScrollEnd: vi.fn()
    };

    console.log('Setting up scroll effects...');
    setupScrollEffects(context);

    console.log('Triggering scroll event...');
    // Get the scroll handler that was registered
    const addEventListenerCall = window.addEventListener.mock.calls.find(call => call[0] === 'scroll');
    expect(addEventListenerCall).toBeDefined();
    
    const scrollHandler = addEventListenerCall[1];
    
    // Call the scroll handler directly
    scrollHandler();

    console.log('requestAnimationFrame call count:', rafSpy.mock.calls.length);
    console.log('Context ticking state:', context.ticking);
    
    // Should not call requestAnimationFrame when already ticking
    expect(rafSpy).not.toHaveBeenCalled();
    expect(context.updateNavbarOnScroll).not.toHaveBeenCalled();
  });
});
