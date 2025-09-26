type ElementHandle<T extends HTMLElement> =
  | T
  | null
  | undefined
  | { current: T | null | undefined };

type ModernNavBarOptions = {
  navBar?: ElementHandle<HTMLElement>;
  mobileMenu?: ElementHandle<HTMLElement>;
  burgerButton?: ElementHandle<HTMLButtonElement>;
  closeButton?: ElementHandle<HTMLButtonElement>;
  themeToggle?: ElementHandle<HTMLButtonElement>;
  searchToggle?: ElementHandle<HTMLButtonElement>;
  searchOverlay?: ElementHandle<HTMLElement>;
};

type CleanupFn = () => void;

function resolveElement<T extends HTMLElement>(handle?: ElementHandle<T>): T | null {
  if (!handle) return null;
  if (typeof (handle as { current?: T | null }).current !== 'undefined') {
    return (handle as { current?: T | null }).current ?? null;
  }
  return (handle as T) ?? null;
}

function setAriaCurrent(navElement: HTMLElement | null) {
  if (!navElement) return;
  const links = navElement.querySelectorAll('a[href]');
  const currentPath = window.location?.pathname;

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === currentPath) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function getCurrentTheme(): 'light' | 'dark' {
  return (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';
}

function setTheme(nextTheme: 'light' | 'dark') {
  const root = document.documentElement;
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
  localStorage.setItem('theme', nextTheme);
}

function updateThemeButton(button: HTMLButtonElement | null, theme: 'light' | 'dark') {
  if (!button) return;
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  const sunIcon = button.querySelector<SVGElement>('.sun-icon');
  const moonIcon = button.querySelector<SVGElement>('.moon-icon');
  sunIcon?.classList.toggle('hidden', theme === 'dark');
  moonIcon?.classList.toggle('hidden', theme !== 'dark');
}

function toggleTheme(button: HTMLButtonElement | null) {
  const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  updateThemeButton(button, nextTheme);
}

function openOverlay(overlay: HTMLElement | null) {
  if (!overlay) return;
  overlay.classList.add('active');
  overlay.inert = false;
  document.body.style.overflow = 'hidden';

  const searchInput = overlay.querySelector<HTMLInputElement>('#search-input');
  if (searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }
}

function closeOverlay(overlay: HTMLElement | null) {
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.inert = true;
  document.body.style.overflow = '';
}

function openMobileMenu(menu: HTMLElement | null, toggle: HTMLElement | null) {
  if (!menu || !toggle) return;
  menu.style.visibility = '';
  menu.classList.add('active');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

  const firstFocusable = menu.querySelector<HTMLElement>('a, button, [tabindex]');
      if (firstFocusable) {
    setTimeout(() => firstFocusable.focus(), 150);
  }
}

function closeMobileMenu(menu: HTMLElement | null, toggle: HTMLElement | null) {
  if (!menu || !toggle) return;
  menu.classList.remove('active');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.classList.remove('active');

  setTimeout(() => {
    if (!menu.classList.contains('active')) {
      menu.style.visibility = 'hidden';
      menu.inert = true;
    }
  }, 250);

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

export function registerModernNavBar(options: ModernNavBarOptions): CleanupFn {
  const navBar = resolveElement(options.navBar);
  const mobileMenu = resolveElement(options.mobileMenu);
  const burgerButton = resolveElement(options.burgerButton);
  const closeButton = resolveElement(options.closeButton);
  const themeToggle = resolveElement(options.themeToggle);
  const searchToggle = resolveElement(options.searchToggle);
  const searchOverlay = resolveElement(options.searchOverlay);

  setAriaCurrent(navBar);

  const cleanupFns: CleanupFn[] = [];

  if (themeToggle) {
    updateThemeButton(themeToggle, getCurrentTheme());
    const handler = (event: Event) => {
      event.preventDefault();
      toggleTheme(themeToggle);
    };
    themeToggle.addEventListener('click', handler);
    cleanupFns.push(() => themeToggle.removeEventListener('click', handler));

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const systemThemeListener = (event: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) return; // respect explicit user choice
      const inferredTheme = event.matches ? 'dark' : 'light';
      setTheme(inferredTheme);
      updateThemeButton(themeToggle, inferredTheme);
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', systemThemeListener);
      cleanupFns.push(() => mediaQuery.removeEventListener('change', systemThemeListener));
    }
  }

  if (burgerButton && mobileMenu) {
    const openHandler = (event: Event) => {
      event.preventDefault();
      openMobileMenu(mobileMenu, burgerButton);
    };

    const closeHandler = (event: Event) => {
      event.preventDefault();
      closeMobileMenu(mobileMenu, burgerButton);
    };

    burgerButton.addEventListener('click', openHandler);
    cleanupFns.push(() => burgerButton.removeEventListener('click', openHandler));

    if (closeButton) {
      closeButton.addEventListener('click', closeHandler);
      cleanupFns.push(() => closeButton.removeEventListener('click', closeHandler));
    }

    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu(mobileMenu, burgerButton);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    cleanupFns.push(() => document.removeEventListener('keydown', escapeHandler));

    const outsideClickHandler = (event: MouseEvent) => {
      if (!mobileMenu.contains(event.target as Node) && !burgerButton.contains(event.target as Node)) {
        if (mobileMenu.classList.contains('active')) {
          closeMobileMenu(mobileMenu, burgerButton);
        }
      }
    };
    document.addEventListener('click', outsideClickHandler);
    cleanupFns.push(() => document.removeEventListener('click', outsideClickHandler));
  }

  if (searchToggle && searchOverlay) {
    const openHandler = (event: Event) => {
      event.preventDefault();
      openOverlay(searchOverlay);
    };

    searchToggle.addEventListener('click', openHandler);
    cleanupFns.push(() => searchToggle.removeEventListener('click', openHandler));

    const overlayClickHandler = (event: MouseEvent) => {
      if (event.target === searchOverlay) {
        closeOverlay(searchOverlay);
      }
    };
    searchOverlay.addEventListener('click', overlayClickHandler);
    cleanupFns.push(() => searchOverlay.removeEventListener('click', overlayClickHandler));

    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchOverlay.classList.contains('active')) {
        closeOverlay(searchOverlay);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    cleanupFns.push(() => document.removeEventListener('keydown', escapeHandler));
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
