import { useEffect, useState, useRef } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const startDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', startDark);
    document.documentElement.dataset.theme = startDark ? 'dark' : 'light';
    setIsDark(startDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
    // Add spin animation
    if (buttonRef.current) {
      buttonRef.current.classList.add('theme-toggle-spin');
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.classList.remove('theme-toggle-spin');
        }
      }, 600); // match animation duration in CSS
    }
  };

  return (
    <button
      id="theme-toggle"
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className="p-2 rounded-md text-navbar-text dark:text-navbar-textDark hover:bg-navbar-hoverBackground dark:hover:bg-navbar-hoverBackgroundDark focus:outline-none focus:ring-2 focus:ring-navbar-text dark:focus:ring-navbar-textDark transition-colors duration-200"
      aria-label="Toggle between dark and light mode"
    >
      <span className="sr-only">Toggle Theme</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 dark:hidden" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 hidden dark:block text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>
    </button>
  );
}