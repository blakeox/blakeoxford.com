/**
 * Shared theme utilities — single source of truth for light/dark/system mode.
 *
 * Used by ModernNavBar, AccessibilityModule, ThemeContext, and ThemeInitIsland.
 */

export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_PREFERENCE_ATTRIBUTE = 'data-theme-preference';
export const THEME_ATTRIBUTE = 'data-theme';
export const DARK_CLASS = 'dark';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Static hex fallbacks for platform chrome (meta theme-color, manifest). */
export const THEME_COLOR_LIGHT = '#4f46e5';
export const THEME_COLOR_DARK = '#080f1a';

const CYCLE_ORDER: ThemePreference[] = ['light', 'dark', 'system'];

export function getSystemTheme(): ResolvedTheme {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readThemePreference(): ThemePreference | null {
	if (typeof window === 'undefined') return null;
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return null;
}

/** @deprecated Use readThemePreference — kept for compatibility during migration. */
export function readStoredTheme(): ThemePreference | null {
	return readThemePreference();
}

export function readThemeCookie(): ThemePreference | null {
	if (typeof document === 'undefined') return null;
	const match = (document.cookie || '').match(/(?:^|;\s*)theme=([^;]+)/);
	if (!match?.[1]) return null;
	const value = decodeURIComponent(match[1]);
	if (value === 'light' || value === 'dark' || value === 'system') return value;
	return null;
}

export function resolveThemePreference(): ThemePreference {
	return readThemeCookie() ?? readThemePreference() ?? 'system';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
	if (preference === 'system') return getSystemTheme();
	return preference;
}

/** Resolve theme for first paint. */
export function resolveInitialTheme(): ResolvedTheme {
	return resolveTheme(resolveThemePreference());
}

export function hasExplicitThemePreference(): boolean {
	return readThemePreference() !== null || readThemeCookie() !== null;
}

function clearInlineThemeTokens(root: HTMLElement): void {
	for (const prop of ['--color-background', '--color-foreground', '--bg', '--fg']) {
		root.style.removeProperty(prop);
	}
}

function writeThemeCookie(preference: ThemePreference): void {
	try {
		document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(preference)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
	} catch {
		/* noop */
	}
}

function persistThemeServerSide(preference: ThemePreference): void {
	try {
		if (typeof fetch === 'function') {
			fetch('/api/set-theme', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ theme: preference }),
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
	preference?: ThemePreference;
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

	const { persist = false, syncServer = false, preference } = options;
	const root = document.documentElement;

	root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
	if (preference) {
		root.setAttribute(THEME_PREFERENCE_ATTRIBUTE, preference);
	}
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

	if (persist && preference) {
		try {
			localStorage.setItem(THEME_STORAGE_KEY, preference);
		} catch {
			/* noop */
		}
		writeThemeCookie(preference);
	}

	if (syncServer && preference) {
		persistThemeServerSide(preference);
	}
}

/** Apply resolved theme on first paint without persisting implicit system preference. */
export function initializeTheme(): ResolvedTheme {
	const preference = resolveThemePreference();
	const explicit = hasExplicitThemePreference();
	const resolved = resolveTheme(preference);
	applyTheme(resolved, {
		preference,
		persist: explicit,
		syncServer: explicit,
	});
	return resolved;
}

/** User-initiated preference change — always persists. */
export function setThemePreference(preference: ThemePreference): ResolvedTheme {
	const resolved = resolveTheme(preference);
	applyTheme(resolved, { preference, persist: true, syncServer: true });
	return resolved;
}

/** @deprecated Use setThemePreference */
export function setTheme(resolvedTheme: ResolvedTheme): void {
	setThemePreference(resolvedTheme);
}

/** System preference change — applies without persisting until user chooses. */
export function applySystemTheme(resolvedTheme: ResolvedTheme): void {
	const preference = readThemePreference() ?? 'system';
	if (preference !== 'system') return;
	applyTheme(resolvedTheme, { preference: 'system' });
}

export function getCurrentTheme(): ResolvedTheme {
	if (typeof document === 'undefined') return 'light';
	const attr = document.documentElement.getAttribute(THEME_ATTRIBUTE);
	if (attr === 'dark' || attr === 'light') return attr;
	return document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
}

export function getThemePreference(): ThemePreference {
	if (typeof document === 'undefined') return 'system';
	const attr = document.documentElement.getAttribute(THEME_PREFERENCE_ATTRIBUTE);
	if (attr === 'light' || attr === 'dark' || attr === 'system') return attr;
	return readThemePreference() ?? 'system';
}

export function cycleThemePreference(): ThemePreference {
	const current = getThemePreference();
	const index = CYCLE_ORDER.indexOf(current);
	const next = CYCLE_ORDER[(index + 1) % CYCLE_ORDER.length];
	setThemePreference(next);
	return next;
}

/** Binary toggle for keyboard shortcuts — flips between light and dark only. */
export function toggleTheme(): ResolvedTheme {
	const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
	return setThemePreference(next);
}

const PREFERENCE_LABELS: Record<ThemePreference, string> = {
	light: 'Theme: light mode. Switch to dark mode.',
	dark: 'Theme: dark mode. Switch to system theme.',
	system: 'Theme: system preference. Switch to light mode.',
};

export function updateThemeToggleButton(
	button: HTMLButtonElement | null,
	preference?: ThemePreference,
): void {
	if (!button) return;
	const pref = preference ?? getThemePreference();
	const resolved = getCurrentTheme();
	button.setAttribute('aria-pressed', String(pref !== 'system' && pref === resolved));
	button.setAttribute('data-theme-preference', pref);
	button.setAttribute('aria-label', PREFERENCE_LABELS[pref]);
}
