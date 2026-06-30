/* eslint-disable no-useless-escape */
export default function ThemeInitIsland() {
 return (
 <script
 dangerouslySetInnerHTML={{
 __html: `(() => {
 try {
 const key = 'theme';
 const cookieMatch = (document.cookie || '').match(/(^|;\s*)theme=([^;]+)/);
 const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch[2]) : null;
 const stored = localStorage.getItem(key);
 const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
 const theme = cookieVal || stored || (prefersDark ? 'dark' : 'light');
 const root = document.documentElement;
 root.dataset.theme = theme;
 if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
 root.style.colorScheme = theme;
 try { localStorage.setItem(key, theme); } catch { void 0; }
 // Also persist theme in a cookie for server-side personalization
 try { document.cookie = key + '=' + encodeURIComponent(theme) + '; Path=/; Max-Age=' + (60*60*24*365) + '; SameSite=Lax'; } catch { void 0; }
 } catch (error) {
 console.warn('Theme initialization failed', error);
 }
})();`
 }}
 />
 );
}
