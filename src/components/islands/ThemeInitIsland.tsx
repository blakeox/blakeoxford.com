/* eslint-disable no-useless-escape */
import {
	THEME_STORAGE_KEY,
	THEME_COOKIE_MAX_AGE,
	THEME_ATTRIBUTE,
	DARK_CLASS,
} from '../../lib/theme';

/**
 * Inline FOUC-prevention script. Logic mirrors src/lib/theme.ts — keep in sync.
 * Does not persist implicit system preference on first visit.
 */
const INIT_SCRIPT = `(() => {
 try {
  const key = '${THEME_STORAGE_KEY}';
  const cookieMatch = (document.cookie || '').match(/(?:^|;\\s*)theme=([^;]+)/);
  const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  const stored = localStorage.getItem(key);
  const explicit = (stored === 'light' || stored === 'dark') || (cookieVal === 'light' || cookieVal === 'dark');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = explicit
    ? (cookieVal === 'light' || cookieVal === 'dark' ? cookieVal : stored)
    : (prefersDark ? 'dark' : 'light');
  const root = document.documentElement;
  root.setAttribute('${THEME_ATTRIBUTE}', theme);
  if (theme === 'dark') { root.classList.add('${DARK_CLASS}'); } else { root.classList.remove('${DARK_CLASS}'); }
  root.style.colorScheme = theme;
  if (explicit) {
   try { localStorage.setItem(key, theme); } catch { void 0; }
   try { document.cookie = key + '=' + encodeURIComponent(theme) + '; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax'; } catch { void 0; }
  }
 } catch (error) {
  console.warn('Theme initialization failed', error);
 }
})();`;

export default function ThemeInitIsland() {
	return (
		<script
			dangerouslySetInnerHTML={{
				__html: INIT_SCRIPT,
			}}
		/>
	);
}
