/**
 * Theme Context
 * 
 * React context for managing theme state across components.
 * Handles light/dark mode with system preference detection.
 * 
 * @module contexts/ThemeContext
 */

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
	type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
	/** Current theme setting (may be 'system') */
	theme: Theme;
	/** Actual theme being displayed */
	resolvedTheme: ResolvedTheme;
	/** Set the theme */
	setTheme: (theme: Theme) => void;
	/** Toggle between light and dark */
	toggleTheme: () => void;
	/** Whether dark mode is active */
	isDark: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_STORAGE_KEY = 'theme';
const THEME_ATTRIBUTE = 'data-theme';
const DARK_CLASS = 'dark';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSystemTheme(): ResolvedTheme {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
	if (typeof window === 'undefined') return 'system';
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		return stored;
	}
	return 'system';
}

function applyTheme(resolvedTheme: ResolvedTheme): void {
	if (typeof document === 'undefined') return;
	
	const root = document.documentElement;
	root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
	
	if (resolvedTheme === 'dark') {
		root.classList.add(DARK_CLASS);
	} else {
		root.classList.remove(DARK_CLASS);
	}
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface ThemeProviderProps {
	children: ReactNode;
	/** Initial theme override */
	defaultTheme?: Theme;
	/** Storage key for persisting theme */
	storageKey?: string;
}

export function ThemeProvider({
	children,
	defaultTheme,
	storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (defaultTheme) return defaultTheme;
		return getStoredTheme();
	});
	
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
		if (theme === 'system') return getSystemTheme();
		return theme;
	});

	// Update resolved theme when theme or system preference changes
	useEffect(() => {
		const resolved = theme === 'system' ? getSystemTheme() : theme;
		setResolvedTheme(resolved);
		applyTheme(resolved);
	}, [theme]);

	// Listen for system theme changes
	useEffect(() => {
		if (theme !== 'system') return;
		
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		const handleChange = (e: MediaQueryListEvent) => {
			const newResolved = e.matches ? 'dark' : 'light';
			setResolvedTheme(newResolved);
			applyTheme(newResolved);
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [theme]);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem(storageKey, newTheme);
	}, [storageKey]);

	const toggleTheme = useCallback(() => {
		const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
		setTheme(newTheme);
	}, [resolvedTheme, setTheme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			resolvedTheme,
			setTheme,
			toggleTheme,
			isDark: resolvedTheme === 'dark',
		}),
		[theme, resolvedTheme, setTheme, toggleTheme]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook to access theme context
 * @throws If used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

/**
 * Hook for simple dark mode check
 */
export function useIsDark(): boolean {
	const { isDark } = useTheme();
	return isDark;
}
