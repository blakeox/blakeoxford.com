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
  if (nextTheme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
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
  overlay.dataset.state = 'open';
  overlay.classList.remove('hidden');
  overlay.inert = false;
  document.body.dataset.searchOpen = 'true';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';

  const searchInput = overlay.querySelector<HTMLInputElement>('#search-input');
  if (searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }
}

function closeOverlay(overlay: HTMLElement | null) {
  if (!overlay) return;
  overlay.dataset.state = 'closed';
  overlay.inert = true;
  delete document.body.dataset.searchOpen;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  setTimeout(() => {
    if (overlay.dataset.state === 'closed') {
      overlay.classList.add('hidden');
    }
  }, 200);
}

function openMobileMenu(menu: HTMLElement | null, toggle: HTMLElement | null, navBar?: HTMLElement | null) {
  if (!menu || !toggle) return;
  const headerEl = (navBar?.closest('header') as HTMLElement | null) ?? null;
  menu.inert = false;
  menu.style.visibility = '';
  menu.classList.add('active');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.classList.add('active');
  // Prevent header/nav controls from intercepting clicks while menu is open
  if (navBar) {
    (navBar as HTMLElement).style.pointerEvents = 'none';
    (navBar as HTMLElement).style.visibility = 'hidden';
    (navBar as HTMLElement).style.display = 'none';
    (navBar as HTMLElement).classList.add('pointer-events-none');
  }
  if (headerEl) {
    headerEl.style.pointerEvents = 'none';
    headerEl.style.visibility = 'hidden';
    headerEl.style.display = 'none';
    headerEl.classList.add('pointer-events-none');
  }
  // Also disable pointer events on the toggle button itself to avoid it capturing events above the panel
  (toggle as HTMLElement).style.pointerEvents = 'none';
  (toggle as HTMLElement).classList.add('pointer-events-none');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

  const firstFocusable = menu.querySelector<HTMLElement>('a, button, [tabindex]');
      if (firstFocusable) {
    setTimeout(() => firstFocusable.focus(), 150);
  }
}

function closeMobileMenu(menu: HTMLElement | null, toggle: HTMLElement | null, navBar?: HTMLElement | null) {
  if (!menu || !toggle) return;
  const headerEl = (navBar?.closest('header') as HTMLElement | null) ?? null;
  menu.classList.remove('active');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.classList.remove('active');

  setTimeout(() => {
    if (!menu.classList.contains('active')) {
      menu.style.visibility = 'hidden';
      menu.inert = true;
    }
  }, 250);

  // Restore pointer events on the nav
  if (navBar) {
    (navBar as HTMLElement).style.pointerEvents = '';
    (navBar as HTMLElement).style.visibility = '';
    (navBar as HTMLElement).style.display = '';
    (navBar as HTMLElement).classList.remove('pointer-events-none');
  }
  if (headerEl) {
    headerEl.style.pointerEvents = '';
    headerEl.style.visibility = '';
    headerEl.style.display = '';
    headerEl.classList.remove('pointer-events-none');
  }
  // Restore pointer events on the toggle button
  (toggle as HTMLElement).style.pointerEvents = '';
  (toggle as HTMLElement).classList.remove('pointer-events-none');
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
  const searchBackdrop = searchOverlay?.querySelector('[data-overlay-backdrop]') ?? null;

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
      openMobileMenu(mobileMenu, burgerButton, navBar);
    };

    const closeHandler = (event: Event) => {
      event.preventDefault();
      closeMobileMenu(mobileMenu, burgerButton, navBar);
    };

    burgerButton.addEventListener('click', openHandler);
    cleanupFns.push(() => burgerButton.removeEventListener('click', openHandler));

    if (closeButton) {
      const closeCapture = (event: Event) => {
        // Prevent outside-click handlers from intercepting this event
        event.stopPropagation();
      };
      closeButton.addEventListener('click', closeCapture, { capture: true });
      closeButton.addEventListener('click', closeHandler);
      cleanupFns.push(() => {
        closeButton.removeEventListener('click', closeCapture, { capture: true } as EventListenerOptions);
        closeButton.removeEventListener('click', closeHandler);
      });
    }

    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu(mobileMenu, burgerButton, navBar);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    cleanupFns.push(() => document.removeEventListener('keydown', escapeHandler));

    const outsideClickHandler = (event: MouseEvent) => {
      // Ignore clicks originating from the close button to avoid premature interception
      if (closeButton && (event.target === closeButton || (closeButton as HTMLElement).contains(event.target as Node))) {
        return;
      }
      if (!mobileMenu.contains(event.target as Node) && !burgerButton.contains(event.target as Node)) {
        if (mobileMenu.classList.contains('active')) {
          closeMobileMenu(mobileMenu, burgerButton, navBar);
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

    if (searchBackdrop instanceof HTMLElement) {
      const overlayClickHandler = (event: MouseEvent) => {
        if (event.target === searchBackdrop) {
          closeOverlay(searchOverlay);
        }
      };
      searchBackdrop.addEventListener('click', overlayClickHandler);
      cleanupFns.push(() => searchBackdrop.removeEventListener('click', overlayClickHandler));
    }

    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchOverlay.dataset.state === 'open') {
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
