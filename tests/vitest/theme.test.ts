import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import {
	applyTheme,
	applySystemTheme,
	getCurrentTheme,
	hasExplicitThemePreference,
	initializeTheme,
	readStoredTheme,
	resolveInitialTheme,
	setTheme,
	toggleTheme,
	THEME_ATTRIBUTE,
	THEME_STORAGE_KEY,
	DARK_CLASS,
} from '../../src/lib/theme';

describe('theme utilities', () => {
	let dom: JSDOM;
	let document: Document;
	let localStorageMock: {
		store: Record<string, string>;
		getItem: (key: string) => string | null;
		setItem: (key: string, value: string) => void;
		removeItem: (key: string) => void;
		clear: () => void;
	};

	beforeEach(() => {
		dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
			url: 'http://localhost:3000',
			pretendToBeVisual: true,
		});
		document = dom.window.document;

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

		global.document = document;
		global.localStorage = localStorageMock as unknown as Storage;
		global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('dark') ? false : false,
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		});

		document.documentElement.className = '';
		document.documentElement.removeAttribute(THEME_ATTRIBUTE);
		document.cookie = '';
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('applyTheme sets data-theme, class, and colorScheme', () => {
		applyTheme('dark');
		expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
		expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
		expect(document.documentElement.style.colorScheme).toBe('dark');
	});

	it('setTheme persists explicit preference', () => {
		setTheme('dark');
		expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBe('dark');
		expect(document.cookie).toContain('theme=dark');
		expect(global.fetch).toHaveBeenCalled();
	});

	it('applySystemTheme does not persist preference', () => {
		applySystemTheme('dark');
		expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
		expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBeNull();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('initializeTheme uses system preference without persisting on first visit', () => {
		const theme = initializeTheme();
		expect(theme).toBe('light');
		expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBeNull();
	});

	it('initializeTheme respects stored explicit preference', () => {
		localStorageMock.setItem(THEME_STORAGE_KEY, 'dark');
		const theme = initializeTheme();
		expect(theme).toBe('dark');
		expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
	});

	it('toggleTheme switches between light and dark and persists', () => {
		applyTheme('light');
		expect(toggleTheme()).toBe('dark');
		expect(getCurrentTheme()).toBe('dark');
		expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBe('dark');

		expect(toggleTheme()).toBe('light');
		expect(getCurrentTheme()).toBe('light');
	});

	it('hasExplicitThemePreference reflects storage and cookies', () => {
		expect(hasExplicitThemePreference()).toBe(false);
		localStorageMock.setItem(THEME_STORAGE_KEY, 'dark');
		expect(hasExplicitThemePreference()).toBe(true);
	});

	it('resolveInitialTheme prefers cookie over system preference', () => {
		document.cookie = 'theme=dark';
		expect(resolveInitialTheme()).toBe('dark');
	});

	it('readStoredTheme returns null for invalid values', () => {
		localStorageMock.setItem(THEME_STORAGE_KEY, 'system');
		expect(readStoredTheme()).toBeNull();
	});
});
