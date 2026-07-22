import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyTheme,
  applySystemTheme,
  cycleThemePreference,
  getThemePreference,
  hasExplicitThemePreference,
  initializeTheme,
  readThemePreference,
  resolveInitialTheme,
  resolveTheme,
  setThemePreference,
  toggleTheme,
  THEME_ATTRIBUTE,
  THEME_PREFERENCE_ATTRIBUTE,
  THEME_STORAGE_KEY,
  DARK_CLASS,
} from '../../src/lib/theme';

describe('theme utilities', () => {
  let localStorageMock: {
    store: Record<string, string>;
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  };

  beforeEach(() => {
    localStorageMock = {
      store: {},
      getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock.store[key];
      }),
      clear: vi.fn(() => {
        localStorageMock.store = {};
      }),
    };

    vi.stubGlobal('localStorage', localStorageMock as unknown as Storage);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch);

    document.documentElement.className = '';
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    document.documentElement.removeAttribute(THEME_PREFERENCE_ATTRIBUTE);
    document.cookie = `${THEME_STORAGE_KEY}=; Path=/; Max-Age=0`;
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applyTheme sets data-theme, preference, class, and colorScheme', () => {
    applyTheme('dark', { preference: 'dark' });
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    expect(document.documentElement.getAttribute(THEME_PREFERENCE_ATTRIBUTE)).toBe('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('setThemePreference persists explicit preference', () => {
    setThemePreference('dark');
    expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.cookie).toContain('theme=dark');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('applySystemTheme updates resolved theme only when preference is system', () => {
    setThemePreference('system');
    applySystemTheme('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);

    setThemePreference('light');
    applySystemTheme('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });

  it('initializeTheme uses system preference without persisting on first visit', () => {
    const theme = initializeTheme();
    expect(theme).toBe('light');
    expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(getThemePreference()).toBe('system');
  });

  it('initializeTheme respects stored explicit preference', () => {
    localStorageMock.setItem(THEME_STORAGE_KEY, 'dark');
    const theme = initializeTheme();
    expect(theme).toBe('dark');
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  });

  it('cycleThemePreference rotates light → dark → system → light', () => {
    setThemePreference('light');
    expect(cycleThemePreference()).toBe('dark');
    expect(cycleThemePreference()).toBe('system');
    expect(cycleThemePreference()).toBe('light');
  });

  it('toggleTheme flips between light and dark only', () => {
    setThemePreference('light');
    expect(toggleTheme()).toBe('dark');
    expect(getThemePreference()).toBe('dark');
    expect(toggleTheme()).toBe('light');
  });

  it('resolveTheme maps system to matchMedia result', () => {
    expect(resolveTheme('system')).toBe('light');
  });

  it('hasExplicitThemePreference reflects storage and cookies', () => {
    expect(hasExplicitThemePreference()).toBe(false);
    localStorageMock.setItem(THEME_STORAGE_KEY, 'system');
    expect(hasExplicitThemePreference()).toBe(true);
  });

  it('resolveInitialTheme prefers cookie over system preference', () => {
    document.cookie = 'theme=dark';
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('readThemePreference returns null for invalid values', () => {
    localStorageMock.setItem(THEME_STORAGE_KEY, 'invalid');
    expect(readThemePreference()).toBeNull();
  });
});
