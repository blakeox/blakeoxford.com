/**
 * Tests for useOnClickOutside hook
 *
 * Validates click outside detection for modals and dropdowns.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOnClickOutside } from '../../../src/lib/hooks/useOnClickOutside';

describe('useOnClickOutside', () => {
  const setupTest = () => {
    const handler = vi.fn();
    const element = document.createElement('div');
    document.body.appendChild(element);

    return { handler, element };
  };

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should call handler when clicking outside the element', () => {
    const { handler, element } = setupTest();
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler));

    // Simulate click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when clicking inside the element', () => {
    const { handler, element } = setupTest();
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler));

    // Simulate click inside
    const event = new MouseEvent('mousedown', { bubbles: true });
    element.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when clicking on a child element', () => {
    const { handler, element } = setupTest();
    const ref = { current: element };
    const child = document.createElement('button');
    element.appendChild(child);

    renderHook(() => useOnClickOutside(ref, handler));

    // Simulate click on child
    const event = new MouseEvent('mousedown', { bubbles: true });
    child.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle touch events', () => {
    const { handler, element } = setupTest();
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler));

    // Simulate touch outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new TouchEvent('touchstart', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when disabled', () => {
    const { handler, element } = setupTest();
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler, false));

    // Simulate click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support multiple refs', () => {
    const handler = vi.fn();
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    const ref1 = { current: element1 };
    const ref2 = { current: element2 };

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    // Click on element1 - should not trigger
    const event1 = new MouseEvent('mousedown', { bubbles: true });
    element1.dispatchEvent(event1);
    expect(handler).not.toHaveBeenCalled();

    // Click on element2 - should not trigger
    const event2 = new MouseEvent('mousedown', { bubbles: true });
    element2.dispatchEvent(event2);
    expect(handler).not.toHaveBeenCalled();

    // Click outside both - should trigger
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    const event3 = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event3);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle null refs gracefully', () => {
    const handler = vi.fn();
    const ref = { current: null };

    // Should not throw when ref is null
    expect(() => {
      renderHook(() => useOnClickOutside(ref, handler));
    }).not.toThrow();

    // Click anywhere should trigger since ref is null
    const event = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('should cleanup listeners on unmount', () => {
    const { handler, element } = setupTest();
    const ref = { current: element };

    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
