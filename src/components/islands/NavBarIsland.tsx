/**
 * NavBarIsland - React island for site navigation
 * 
 * Interactive navigation bar with mobile menu, logo, and responsive design.
 * Integrates ModernNavBar and MotionAccessibility for enhanced UX.
 * 
 * @component
 * @category Islands
 * 
 * @example
 * ```tsx
 * <NavBarIsland
 *   client:load
 *   links={navLinks}
 *   currentPath={Astro.url.pathname}
 *   logo={logoConfig}
 * />
 * ```
 * 
 * @prop {NavLink[]} links - Navigation links configuration
 * @prop {LogoConfig} logo - Logo configuration with name and avatar
 * @prop {string} [currentPath] - Current page path for active link highlighting
 * 
 * @accessibility
 * - Semantic nav element
 * - Mobile menu with ARIA attributes
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Focus management for menu toggle
 * - Screen reader announcements
 */
import { useEffect, useRef, useState } from 'react';

import type { NavLink } from '../../config/navLinks';
import { registerModernNavBar } from '../../scripts/features/ModernNavBar';
import { initMotionAccessibility } from '../../scripts/modules/MotionAccessibility';

type LogoAvatar = {
  jpg: string;
  webp?: string;
  avif?: string;
};

type LogoConfig = {
  name: string;
  avatar: LogoAvatar;
};

type NavBarIslandProps = {
  links: NavLink[];
  logo: LogoConfig;
  currentPath: string;
};

const normalizePath = (path: string): string => {
  if (!path) return '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

export default function NavBarIsland({ links, logo, currentPath }: NavBarIslandProps) {
  const navRef = useRef<HTMLElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const burgerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const themeToggleRef = useRef<HTMLButtonElement | null>(null);
  const searchToggleRef = useRef<HTMLButtonElement | null>(null);

  const [activePath, setActivePath] = useState(() => normalizePath(currentPath));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      // Mark hydration success as early as possible
      (window as typeof window & { __navHydrated?: boolean }).__navHydrated = true;

      setActivePath(normalizePath(window.location.pathname));

      if (mobileMenuRef.current) {
        mobileMenuRef.current.setAttribute('inert', '');
        // Hide until opened to avoid accidental focus
        (mobileMenuRef.current as HTMLElement).style.visibility = 'hidden';
        // Ensure the mobile menu is portaled to the document body to avoid header stacking context conflicts
        try {
          const menuEl = mobileMenuRef.current as HTMLElement;
          if (menuEl && menuEl.parentElement && menuEl.parentElement.tagName.toLowerCase() !== 'body') {
            document.body.appendChild(menuEl);
            menuEl.dataset.portaled = 'true';
          }
        } catch (e) {
          // no-op: if portal fails, we keep the menu in place
          if (typeof console !== 'undefined') {
            console.debug('[NavBarIsland] mobile menu portal skipped', e);
          }
        }
      }

      const cleanupNav = registerModernNavBar({
        navBar: navRef.current,
        mobileMenu: mobileMenuRef.current,
        burgerButton: burgerButtonRef.current,
        closeButton: closeButtonRef.current,
        themeToggle: themeToggleRef.current,
        searchToggle: searchToggleRef.current,
        searchOverlay: document.getElementById('search-overlay')
      });

      if (!(window as typeof window & { __motionAccessibilityInit?: boolean }).__motionAccessibilityInit) {
        initMotionAccessibility();
        (window as typeof window & { __motionAccessibilityInit?: boolean }).__motionAccessibilityInit = true;
      }

      const navEl = navRef.current;
      const handleScroll = () => {
        if (!navEl) return;
        navEl.classList.toggle('has-background', window.scrollY > 80);
      };
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });

      if (themeToggleRef.current) {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        themeToggleRef.current.setAttribute('aria-pressed', String(currentTheme === 'dark'));
        const sunIcon = themeToggleRef.current.querySelector<SVGElement>('.sun-icon');
        const moonIcon = themeToggleRef.current.querySelector<SVGElement>('.moon-icon');
        sunIcon?.classList.toggle('hidden', currentTheme === 'dark');
        moonIcon?.classList.toggle('hidden', currentTheme !== 'dark');
      }

      return () => {
        cleanupNav?.();
        window.removeEventListener('scroll', handleScroll);
      };
    } catch (err) {
      // Swallow errors to keep SSR markup visible; fallback script can attach behavior
      console.error('[NavBarIsland] hydration error', err);
    }
  }, []);

  const isActive = (href: string): boolean => {
    if (!href.startsWith('/')) {
      return false;
    }
    return normalizePath(href) === normalizePath(activePath);
  };

  return (
    <div className="sticky top-0 z-50 border-b border-[--border]/40 bg-[--bg]/90 backdrop-blur supports-[backdrop-filter]:bg-[--bg]/65">
  <nav
        id="navbar"
        ref={navRef}
  className="relative z-10 mx-auto flex h-[65px] w-full max-w-[110rem] items-center justify-between px-4 sm:px-6 lg:px-8 text-[--fg]"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="brand-section flex items-center gap-2">
          <a
            href="/"
            className="brand-link flex items-center gap-2 rounded-full px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={logo.name}
          >
            <picture className="brand-avatar-container size-9 overflow-hidden rounded-full border border-border/60">
              {logo.avatar.avif && <source srcSet={logo.avatar.avif} type="image/avif" />}
              {logo.avatar.webp && <source srcSet={logo.avatar.webp} type="image/webp" />}
              <img
                src={logo.avatar.avif || logo.avatar.webp || logo.avatar.jpg}
                alt=""
                aria-hidden="true"
                className="brand-avatar size-9 object-cover"
                width={640}
                height={640}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="brand-text text-sm font-semibold tracking-tight text-[--fg]">
              {logo.name}
            </span>
          </a>
        </div>

        <ul className="desktop-nav hidden gap-1 md:flex" role="menubar">
          {links.map((link) => (
            <li className="nav-item" role="none" key={link.href}>
              <a
                href={link.href}
                role="menuitem"
                className={`nav-link inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/60 focus-visible:ring-offset-2 ${
                  isActive(link.href)
                    ? 'text-accent'
                    : 'text-[--fg]/75'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="action-buttons flex items-center gap-2">
          <button
            id="search-toggle"
            ref={searchToggleRef}
            type="button"
            className="search-toggle inline-flex size-11 items-center justify-center rounded-full border border-[--border]/50 text-[--fg]/70 transition hover:border-[--border] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
            aria-label="Open search"
            aria-controls="search-overlay"
            aria-expanded="false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
          </button>

          <button
            id="theme-toggle"
            ref={themeToggleRef}
            type="button"
            className="theme-toggle inline-flex size-11 items-center justify-center rounded-full border border-[--border]/50 text-[--fg]/70 transition hover:border-[--border] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
            aria-label="Toggle dark mode"
            aria-pressed="false"
          >
            <svg className="sun-icon size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4 4.2 19.8m15.6-15.6-1.4 1.4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
            </svg>
            <svg className="moon-icon hidden size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
            </svg>
          </button>

          <button
            id="nav-toggle"
            ref={burgerButtonRef}
            type="button"
            className="burger-menu-button inline-flex size-11 items-center justify-center rounded-full border border-[--border]/50 text-[--fg]/80 transition hover:border-[--border] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] md:hidden"
            aria-label="Toggle navigation menu"
            aria-controls="nav-mobile-links"
            aria-expanded="false"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      <div
        ref={mobileMenuRef}
        id="nav-mobile-links"
        className="mobile-menu fixed inset-0 md:hidden pointer-events-auto z-[2147483646]"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
  <div
  className="mobile-menu-backdrop fixed inset-0 bg-[color:rgb(0_0_0_/_0.4)] z-[2147483646] pointer-events-auto"
    onClick={() => {
      // Let outside click handler close via document listener; don't stop propagation.
    }}
  />
  <div
  className="mobile-menu-content fixed inset-y-0 right-0 z-[2147483647] flex w-80 max-w-[85vw] flex-col gap-6 bg-[--surface] text-[--fg] px-5 py-6 shadow-2xl pointer-events-auto"
    onClick={(e) => {
      // Prevent clicks inside the panel from being treated as outside clicks.
      e.stopPropagation();
    }}
  >
          <div className="mobile-menu-header flex items-center justify-between">
            <button
              id="close-mobile-menu"
              ref={closeButtonRef}
              type="button"
              className="mobile-close-button inline-flex size-10 items-center justify-center rounded-full border border-[--border]/50 text-[--fg]/70 transition hover:border-[--border] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] pointer-events-auto touch-manipulation"
              aria-label="Close navigation menu"
              onClick={() => {
                try {
                  const menu = document.getElementById('nav-mobile-links');
                  const burger = document.getElementById('nav-toggle');
                  if (menu) {
                    menu.classList.remove('active');
                    menu.style.visibility = 'hidden';
                    (menu as HTMLElement).inert = true;
                  }
                  if (burger) {
                    burger.setAttribute('aria-expanded', 'false');
                    burger.classList.remove('active');
                    burger.style.pointerEvents = '';
                  }
                  // Restore body scroll just in case
                  document.body.style.overflow = '';
                  document.body.style.position = '';
                  document.body.style.width = '';
                } catch {
                  // no-op
                }
              }}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 18 12-12M6 6l12 12" />
              </svg>
            </button>
            <span className="text-sm font-semibold tracking-wide text-foreground/75">Menu</span>
          </div>
          <ul className="mobile-nav flex flex-col gap-1" role="menubar">
            {links.map((link) => (
              <li className="mobile-nav-item" role="none" key={`mobile-${link.href}`}>
                <a
                  href={link.href}
                  role="menuitem"
                  className="mobile-nav-link block rounded-xl px-3 py-2 text-base font-semibold text-[--fg]/80 transition hover:bg-[--bg]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

