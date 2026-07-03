import {
	THEME_STORAGE_KEY,
	THEME_COOKIE_MAX_AGE,
	THEME_ATTRIBUTE,
	THEME_PREFERENCE_ATTRIBUTE,
	DARK_CLASS,
} from '../../lib/theme';

/**
 * Inline FOUC-prevention script. Logic mirrors src/lib/theme.ts — keep in sync.
 * Does not persist implicit system preference on first visit.
 */
const INIT_SCRIPT = `(() => {
 try {
  const key = '${THEME_STORAGE_KEY}';
  const prefKey = '${THEME_PREFERENCE_ATTRIBUTE}';
  const cookieMatch = (document.cookie || '').match(/(?:^|;\s*)theme=([^;]+)/);
  const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  const stored = localStorage.getItem(key);
  const preference = (stored === 'light' || stored === 'dark' || stored === 'system')
    ? stored
    : ((cookieVal === 'light' || cookieVal === 'dark' || cookieVal === 'system') ? cookieVal : 'system');
  const explicit = (stored === 'light' || stored === 'dark' || stored === 'system')
    || (cookieVal === 'light' || cookieVal === 'dark' || cookieVal === 'system');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
  const root = document.documentElement;
  root.setAttribute('${THEME_ATTRIBUTE}', theme);
  root.setAttribute(prefKey, preference);
  if (theme === 'dark') { root.classList.add('${DARK_CLASS}'); } else { root.classList.remove('${DARK_CLASS}'); }
  root.style.colorScheme = theme;
  if (explicit) {
   try { localStorage.setItem(key, preference); } catch { void 0; }
   try { document.cookie = key + '=' + encodeURIComponent(preference) + '; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax'; } catch { void 0; }
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
