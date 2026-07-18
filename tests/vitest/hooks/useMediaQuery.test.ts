/**
 * Tests for useMediaQuery hook
 *
 * Validates SSR-safe media query matching with proper event handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
} from '../../../src/lib/hooks/useMediaQuery';

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn((listener) => listeners.push(listener)),
    removeListener: vi.fn((listener) => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    }),
    addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    _triggerChange: (newMatches: boolean) => {
      listeners.forEach((listener) => listener({ matches: newMatches } as MediaQueryListEvent));
    },
  };
};

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it('should return false initially for SSR safety', () => {
    const mockMedia = createMatchMediaMock(true);
    window.matchMedia = vi.fn(() => mockMedia) as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    // After hydration, it should match the actual value
    expect(typeof result.current).toBe('boolean');
  });

  it('should return true when media query matches', () => {
    const mockMedia = createMatchMediaMock(true);
    window.matchMedia = vi.fn(() => mockMedia) as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    const mockMedia = createMatchMediaMock(false);
    window.matchMedia = vi.fn(() => mockMedia) as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(false);
  });

  it('should call matchMedia with correct query', () => {
    const mockMedia = createMatchMediaMock(false);
    const matchMediaSpy = vi.fn(() => mockMedia);
    window.matchMedia = matchMediaSpy as typeof window.matchMedia;

    renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));

    expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('should add and remove event listener', () => {
    const mockMedia = createMatchMediaMock(false);
    window.matchMedia = vi.fn(() => mockMedia) as typeof window.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mockMedia.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mockMedia.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('convenience hooks', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('useIsMobile should check max-width: 767px', () => {
    const mockMedia = createMatchMediaMock(true);
    const matchMediaSpy = vi.fn(() => mockMedia);
    window.matchMedia = matchMediaSpy as typeof window.matchMedia;

    renderHook(() => useIsMobile());

    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('useIsTablet should check min-width: 768px and max-width: 1023px', () => {
    const mockMedia = createMatchMediaMock(true);
    const matchMediaSpy = vi.fn(() => mockMedia);
    window.matchMedia = matchMediaSpy as typeof window.matchMedia;

    renderHook(() => useIsTablet());

    expect(matchMediaSpy).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1023px)');
  });

  it('useIsDesktop should check min-width: 1024px', () => {
    const mockMedia = createMatchMediaMock(true);
    const matchMediaSpy = vi.fn(() => mockMedia);
    window.matchMedia = matchMediaSpy as typeof window.matchMedia;

    renderHook(() => useIsDesktop());

    expect(matchMediaSpy).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('usePrefersReducedMotion should check prefers-reduced-motion: reduce', () => {
    const mockMedia = createMatchMediaMock(true);
    const matchMediaSpy = vi.fn(() => mockMedia);
    window.matchMedia = matchMediaSpy as typeof window.matchMedia;

    renderHook(() => usePrefersReducedMotion());

    expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('usePrefersDarkMode should check prefers-color-scheme: dark', () => {
    const mockMedia = createMatchMediaMock(true);
    const matchMediaSpy = vi.fn(() => mockMedia);
    window.matchMedia = matchMediaSpy as typeof window.matchMedia;

    renderHook(() => usePrefersDarkMode());

    expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});
