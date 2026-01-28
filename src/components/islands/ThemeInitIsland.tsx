export default function ThemeInitIsland() {
  try { console.debug('ThemeInitIsland executing'); } catch (e) {}
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(() => {
  try {
    const key = 'theme';
    const stored = localStorage.getItem(key);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    const root = document.documentElement;
    root.dataset.theme = theme;
  if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    root.style.colorScheme = theme;
    localStorage.setItem(key, theme);
  } catch (error) {
    console.warn('Theme initialization failed', error);
  }
})();`
      }}
    />
  );
}
