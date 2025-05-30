import '@testing-library/jest-dom';
import { vi, afterEach, beforeAll } from 'vitest';

// --- Mock matchMedia (for responsive components) ---
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// --- Mock localStorage (basic persistence simulation) ---
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
      get length() {
        return Object.keys(store).length;
      },
    };
  })(),
});

// --- Mock requestAnimationFrame & cancelAnimationFrame (animation timing) ---
window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
  setTimeout(() => callback(Date.now()), 0)) as any;

window.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as any;

// --- Optional: Mock IntersectionObserver (for lazy loading, scroll tracking) ---
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// --- Optional: Silence console noise during test runs ---
beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// --- Reset all mocks between tests ---
afterEach(() => {
  vi.clearAllMocks();
});