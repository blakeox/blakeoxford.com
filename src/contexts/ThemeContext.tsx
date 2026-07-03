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
	readThemePreference,
	setThemePreference,
	applySystemTheme,
	getCurrentTheme,
	getThemePreference,
	cycleThemePreference,
	resolveTheme,
	type ResolvedTheme,
	type ThemePreference,
} from '../lib/theme';

export type Theme = ThemePreference;

export interface ThemeContextValue {
	/** Current theme setting (may be 'system') */
	theme: ThemePreference;
	/** Actual theme being displayed */
	resolvedTheme: ResolvedTheme;
	/** Set the theme */
	setTheme: (theme: ThemePreference) => void;
	/** Cycle light → dark → system */
	cycleTheme: () => void;
	/** Toggle between light and dark (keyboard shortcut compat) */
	toggleTheme: () => void;
	/** Whether dark mode is active */
	isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: ThemePreference;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<ThemePreference>(() => {
		if (defaultTheme) return defaultTheme;
		return readThemePreference() ?? 'system';
	});

	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
		return resolveTheme(theme);
	});

	useEffect(() => {
		const resolved = resolveTheme(theme);
		setResolvedTheme(resolved);
		setThemePreference(theme);
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

	const setTheme = useCallback((newTheme: ThemePreference) => {
		setThemeState(newTheme);
		setResolvedTheme(resolveTheme(newTheme));
	}, []);

	const cycleTheme = useCallback(() => {
		const next = cycleThemePreference();
		setThemeState(next);
		setResolvedTheme(getCurrentTheme());
	}, []);

	const toggleTheme = useCallback(() => {
		const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
		setTheme(next);
	}, [setTheme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			resolvedTheme,
			setTheme,
			cycleTheme,
			toggleTheme,
			isDark: resolvedTheme === 'dark',
		}),
		[theme, resolvedTheme, setTheme, cycleTheme, toggleTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}

export function useIsDark(): boolean {
	const { isDark } = useTheme();
	return isDark;
}

export { getCurrentTheme, readThemePreference, getThemePreference };
export type { ResolvedTheme, ThemePreference } from '../lib/theme';
