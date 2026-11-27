(() => {
  const root = document.documentElement;
  const preference = 'bo-atlas-theme';
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const get = () => { try { return localStorage.getItem(preference) || 'system'; } catch { return 'system'; } };
  const render = (mode) => root.setAttribute('data-theme', mode === 'dark' || (mode === 'system' && dark.matches) ? 'dark' : 'light');
  render(get());
  dark.addEventListener('change', () => render(get()));
  document.addEventListener('DOMContentLoaded', () => {
    const picker = document.querySelector('#bo-theme');
    if (!picker) return;
    picker.value = get();
    picker.addEventListener('change', () => {
      try { localStorage.setItem(preference, picker.value); } catch { /* local storage can be disabled */ }
      render(picker.value);
    });
  });
})();
