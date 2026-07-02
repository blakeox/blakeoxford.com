/**
 * Shared theme utilities — single source of truth for light/dark mode.
 *
 * Used by ModernNavBar, AccessibilityModule, ThemeContext, and ThemeInitIsland.
 */

export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_ATTRIBUTE = 'data-theme';
export const DARK_CLASS = 'dark';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Static hex fallbacks for platform chrome (meta theme-color, manifest). */
export const THEME_COLOR_LIGHT = '#4f46e5';
export const THEME_COLOR_DARK = '#080f1a';

export function getSystemTheme(): ResolvedTheme {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readStoredTheme(): ResolvedTheme | null {
	if (typeof window === 'undefined') return null;
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return null;
}

export function readThemeCookie(): ResolvedTheme | null {
	if (typeof document === 'undefined') return null;
	const match = (document.cookie || '').match(/(?:^|;\s*)theme=([^;]+)/);
	if (!match?.[1]) return null;
	const value = decodeURIComponent(match[1]);
	if (value === 'light' || value === 'dark') return value;
	return null;
}

/** Resolve theme for first paint: explicit storage/cookie wins, else system preference. */
export function resolveInitialTheme(): ResolvedTheme {
	return readThemeCookie() ?? readStoredTheme() ?? getSystemTheme();
}

export function hasExplicitThemePreference(): boolean {
	return readStoredTheme() !== null || readThemeCookie() !== null;
}

function clearInlineThemeTokens(root: HTMLElement): void {
	for (const prop of ['--color-background', '--color-foreground', '--bg', '--fg']) {
		root.style.removeProperty(prop);
	}
}

function writeThemeCookie(theme: ResolvedTheme): void {
	try {
		document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(theme)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
	} catch {
		/* noop */
	}
}

function persistThemeServerSide(theme: ResolvedTheme): void {
	try {
		if (typeof fetch === 'function') {
			fetch('/api/set-theme', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ theme }),
				keepalive: true,
			}).catch(() => {
				/* Fail silently */
			});
		}
	} catch {
		/* noop */
	}
}

export interface ApplyThemeOptions {
	/** When true, write localStorage + cookies (user explicitly chose a theme). */
	persist?: boolean;
	/** When true, POST to /api/set-theme for HttpOnly SSR cookie. */
	syncServer?: boolean;
}

export function applyTheme(
	resolvedTheme: ResolvedTheme,
	options: ApplyThemeOptions = {},
): void {
	if (typeof document === 'undefined') return;

	const { persist = false, syncServer = false } = options;
	const root = document.documentElement;

	root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
	if (resolvedTheme === 'dark') {
		root.classList.add(DARK_CLASS);
	} else {
		root.classList.remove(DARK_CLASS);
	}
	root.style.colorScheme = resolvedTheme;

	try {
		if (
			typeof window !== 'undefined' &&
			((window as Window & { __TEST_THEME_PRIMED?: boolean }).__TEST_THEME_PRIMED ||
				root.style.getPropertyValue('--color-background'))
		) {
			clearInlineThemeTokens(root);
		}
	} catch {
		/* noop */
	}

	if (persist) {
		try {
			localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
		} catch {
			/* noop */
		}
		writeThemeCookie(resolvedTheme);
	}

	if (syncServer) {
		persistThemeServerSide(resolvedTheme);
	}
}

/** Apply resolved theme on first paint without persisting implicit system preference. */
export function initializeTheme(): ResolvedTheme {
	const resolved = resolveInitialTheme();
	const explicit = hasExplicitThemePreference();
	applyTheme(resolved, { persist: explicit, syncServer: explicit });
	return resolved;
}

/** User-initiated theme change — always persists. */
export function setTheme(resolvedTheme: ResolvedTheme): void {
	applyTheme(resolvedTheme, { persist: true, syncServer: true });
}

/** System preference change — applies without persisting until user toggles. */
export function applySystemTheme(resolvedTheme: ResolvedTheme): void {
	applyTheme(resolvedTheme, { persist: false, syncServer: false });
}

export function getCurrentTheme(): ResolvedTheme {
	if (typeof document === 'undefined') return 'light';
	const attr = document.documentElement.getAttribute(THEME_ATTRIBUTE);
	if (attr === 'dark' || attr === 'light') return attr;
	return document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
}

export function toggleTheme(): ResolvedTheme {
	const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
	setTheme(nextTheme);
	return nextTheme;
}

export function updateThemeToggleButton(
	button: HTMLButtonElement | null,
	theme: ResolvedTheme,
): void {
	if (!button) return;
	button.setAttribute('aria-pressed', String(theme === 'dark'));
	button.setAttribute(
		'aria-label',
		theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
	);
}
