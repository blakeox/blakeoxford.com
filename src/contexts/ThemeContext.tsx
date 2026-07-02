/**
 * Theme Context
 *
 * React context for managing theme state across components.
 * Delegates DOM updates to src/lib/theme.ts.
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
import {
	getSystemTheme,
	readStoredTheme,
	setTheme as persistTheme,
	applySystemTheme,
	getCurrentTheme,
	toggleTheme as toggleResolvedTheme,
	type ResolvedTheme,
	THEME_STORAGE_KEY,
} from '../lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredThemeSetting(): Theme {
	if (typeof window === 'undefined') return 'system';
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return 'system';
}

function resolveTheme(theme: Theme): ResolvedTheme {
	return theme === 'system' ? getSystemTheme() : theme;
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
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (defaultTheme) return defaultTheme;
		return getStoredThemeSetting();
	});

	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
		return resolveTheme(theme);
	});

	useEffect(() => {
		const resolved = resolveTheme(theme);
		setResolvedTheme(resolved);
		if (theme === 'system') {
			applySystemTheme(resolved);
		} else {
			persistTheme(resolved);
		}
	}, [theme]);

	useEffect(() => {
		if (theme !== 'system') return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const handleChange = (e: MediaQueryListEvent) => {
			const newResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
			setResolvedTheme(newResolved);
			applySystemTheme(newResolved);
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [theme]);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
		if (newTheme === 'system') {
			localStorage.removeItem(THEME_STORAGE_KEY);
			const resolved = getSystemTheme();
			setResolvedTheme(resolved);
			applySystemTheme(resolved);
			return;
		}
		persistTheme(newTheme);
		setResolvedTheme(newTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		const nextTheme = toggleResolvedTheme();
		setThemeState(nextTheme);
		setResolvedTheme(nextTheme);
	}, []);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			resolvedTheme,
			setTheme,
			toggleTheme,
			isDark: resolvedTheme === 'dark',
		}),
		[theme, resolvedTheme, setTheme, toggleTheme],
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

/** Re-export resolved theme reader for islands that cannot use context. */
export { getCurrentTheme, readStoredTheme };
export type { ResolvedTheme } from '../lib/theme';
