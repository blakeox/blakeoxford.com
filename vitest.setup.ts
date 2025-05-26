import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      clear: vi.fn(() => { store = {}; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() { return Object.keys(store).length; },
    };
  })(),
});

// Mock requestAnimationFrame and cancelAnimationFrame
window.requestAnimationFrame = function(callback) {
  return setTimeout(() => callback(Date.now()), 0);
} as unknown as typeof window.requestAnimationFrame;

window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
} as unknown as typeof window.cancelAnimationFrame;
