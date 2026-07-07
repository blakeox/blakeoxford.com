import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  closeMobileMenu,
  closeSearch,
  closeAllHeaderOverlays,
  registerEscapeHandler,
  registerMobileMenuClose,
  registerSearchClose,
  resetHeaderControllerForTests,
} from '../../src/utils/headerController';

describe('headerController', () => {
  beforeEach(() => {
    resetHeaderControllerForTests();
  });

  afterEach(() => {
    resetHeaderControllerForTests();
  });

  it('routes escape to the highest-priority active handler', () => {
    const searchHandle = vi.fn();
    const menuHandle = vi.fn();

    registerEscapeHandler({
      id: 'mobile-menu',
      priority: 1,
      isActive: () => true,
      handle: menuHandle,
    });
    registerEscapeHandler({
      id: 'search',
      priority: 2,
      isActive: () => true,
      handle: searchHandle,
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const prevented = event.preventDefault;
    let preventedCalled = false;
    event.preventDefault = () => {
      preventedCalled = true;
      prevented.call(event);
    };

    document.dispatchEvent(event);

    expect(searchHandle).toHaveBeenCalledOnce();
    expect(menuHandle).not.toHaveBeenCalled();
    expect(preventedCalled).toBe(true);
  });

  it('invokes registered mobile menu and search close callbacks', () => {
    const menuClose = vi.fn();
    const searchClose = vi.fn();

    registerMobileMenuClose(menuClose);
    registerSearchClose(searchClose);

    closeMobileMenu();
    closeSearch();

    expect(menuClose).toHaveBeenCalledOnce();
    expect(searchClose).toHaveBeenCalledOnce();
  });

  it('closes every registered header overlay', () => {
    const menuClose = vi.fn();
    const searchClose = vi.fn();

    registerMobileMenuClose(menuClose);
    registerSearchClose(searchClose);

    closeAllHeaderOverlays();

    expect(menuClose).toHaveBeenCalledOnce();
    expect(searchClose).toHaveBeenCalledOnce();
  });

  it('ignores escape when no handler is active', () => {
    const handler = vi.fn();

    registerEscapeHandler({
      id: 'search',
      priority: 2,
      isActive: () => false,
      handle: handler,
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });
});
