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
    // Ensure minimal CSS variables are present immediately for tests that probe computed styles
    try {
      if (!getComputedStyle(root).getPropertyValue('--color-background').trim()) {
        root.style.setProperty('--color-background', theme === 'dark' ? '#0f172a' : '#f8fafc');
        root.style.setProperty('--color-foreground', theme === 'dark' ? '#f8fafc' : '#111827');
        root.style.setProperty('--bg', 'var(--color-background)');
      }
    } catch (err) { /* noop */ }
    localStorage.setItem(key, theme);
  } catch (error) {
    console.warn('Theme initialization failed', error);
  }
})();`
      }}
    />
  );
}
