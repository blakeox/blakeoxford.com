/**
 * NavBarIsland - React island for site navigation
 *
 * Interactive navigation bar with mobile menu, logo, and responsive design.
 * Integrates ModernNavBar and MotionAccessibility for enhanced UX.
 */
import { useEffect, useRef, useState } from 'react';

import type { NavLink } from '../../config/navLinks';
import { normalizeNavPath } from '../../config/navLinks';
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

export default function NavBarIsland({ links, logo, currentPath }: NavBarIslandProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const burgerButtonRef = useRef<HTMLButtonElement | null>(null);
  const themeToggleRef = useRef<HTMLButtonElement | null>(null);

  const [activePath, setActivePath] = useState(() => normalizeNavPath(currentPath));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      (window as typeof window & { __navHydrated?: boolean }).__navHydrated = true;

      const syncActivePath = () => setActivePath(normalizeNavPath(window.location.pathname));
      syncActivePath();
      document.addEventListener('astro:page-load', syncActivePath);

      if (mobileMenuRef.current) {
        mobileMenuRef.current.setAttribute('inert', '');
        mobileMenuRef.current.style.pointerEvents = 'none';
      }

      const cleanupNav = registerModernNavBar({
        navBar: navRef.current,
        mobileMenu: mobileMenuRef.current,
        burgerButton: burgerButtonRef.current,
        themeToggle: themeToggleRef.current,
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

      return () => {
        cleanupNav?.();
        document.removeEventListener('astro:page-load', syncActivePath);
        window.removeEventListener('scroll', handleScroll);
      };
    } catch (err) {
      console.error('[NavBarIsland] hydration error', err);
    }
  }, []);

  const isActive = (href: string): boolean => {
    if (!href.startsWith('/')) return false;
    return normalizeNavPath(href) === normalizeNavPath(activePath);
  };

  const renderLink = (link: NavLink, className: string, keyPrefix: string) => {
    const external = Boolean(link.external);
    const linkProps = external
      ? { target: link.target ?? '_blank', rel: 'noopener noreferrer' }
      : {};

    return (
      <li className={keyPrefix === 'desktop' ? 'nav-item' : 'mobile-nav-item'} key={`${keyPrefix}-${link.href}`}>
        <a
          href={link.href}
          className={className}
          aria-current={!external && isActive(link.href) ? 'page' : undefined}
          {...linkProps}
        >
          {link.label}
        </a>
      </li>
    );
  };

  return (
    <div
      ref={shellRef}
      className="@container nav-shell relative overflow-visible sticky top-0 z-nav border-b border-border/40 bg-[color:var(--glass-surface-bg)] backdrop-blur supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg-xl)]"
    >
      <nav
        id="navbar"
        ref={navRef}
        className="relative z-10 mx-auto flex h-[72px] w-full max-w-container-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-foreground"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="brand-section flex items-center gap-2">
          <a
            href="/"
            className="brand-link focus-ring-interactive flex items-center gap-3 rounded-full px-2 py-1 text-foreground"
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
            <span className="brand-text flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-foreground">{logo.name}</span>
              <span className="hidden text-[0.7rem] font-medium uppercase tracking-[0.16em] text-subtle-foreground sm:block">
                Systems architect
              </span>
            </span>
          </a>
        </div>

        <ul className="desktop-nav hidden gap-1 md:flex md:flex-1 md:justify-center">
          {links.map((link) =>
            renderLink(
              link,
              `nav-link focus-ring-interactive inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:text-accent ${
                isActive(link.href)
                  ? 'bg-surface-subtle text-foreground ring-1 ring-inset ring-accent/40'
                  : 'text-foreground/90'
              }`,
              'desktop',
            ),
          )}
        </ul>

        <div className="action-buttons flex items-center gap-2">
          <button
            id="search-toggle"
            type="button"
            className="nav-utility-button search-toggle"
            aria-label="Open site search"
            aria-haspopup="dialog"
            aria-controls="search-overlay"
            aria-expanded="false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
          </button>

          <button
            id="theme-toggle"
            ref={themeToggleRef}
            type="button"
            className="nav-utility-button theme-toggle relative shrink-0"
            aria-label="Theme: system preference. Switch to light mode."
            aria-pressed="false"
            data-theme-preference="system"
          >
            <span className="pointer-events-none relative block size-6" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="sun-icon absolute inset-0 size-6" data-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} focusable="false">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4 4.2 19.8m15.6-15.6-1.4 1.4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" className="moon-icon absolute inset-0 size-6 translate-x-px" data-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} focusable="false">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" className="system-icon absolute inset-0 size-6" data-icon="system" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} focusable="false">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L8 21h8l-1.75-4M12 3v1m6.364 1.636-.707.707M21 12h-1M18.364 18.364l-.707-.707M12 19v1M5.636 18.364l.707-.707M4 12H3m2.636-6.364.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
            </span>
          </button>

          <button
            id="nav-toggle"
            ref={burgerButtonRef}
            type="button"
            className="nav-utility-button burger-menu-button md:hidden"
            aria-label="Toggle navigation menu"
            aria-controls="nav-mobile-links"
            aria-expanded="false"
          >
            <span className="burger-icon" aria-hidden="true">
              <span className="burger-line" />
              <span className="burger-line" />
              <span className="burger-line" />
            </span>
          </button>
        </div>
      </nav>

      {/* No-JS mobile fallback — hidden once ModernNavBar sets data-js-nav on #navbar */}
      <details className="mobile-nav-fallback border-t border-border/40 bg-surface/98 px-4 py-3 md:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Menu</summary>
        <ul className="mt-2 flex flex-col gap-1">
          {links.map((link) =>
            renderLink(
              link,
              'mobile-nav-link touch-target focus-ring-interactive flex min-h-11 items-center rounded-2xl px-3 py-3 text-sm font-semibold text-foreground/88 transition hover:bg-[color:var(--glass-surface-bg)]',
              'fallback',
            ),
          )}
        </ul>
      </details>

      <div
        ref={mobileMenuRef}
        id="nav-mobile-links"
        className="mobile-menu border-t border-border bg-surface/98 shadow-lg md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        inert
      >
        <div
          className="mobile-menu-content flex w-full flex-col gap-2 px-4 py-4 text-foreground @sm:gap-3 @sm:px-5 @sm:py-5"
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="mobile-nav flex flex-col gap-1">
            {links.map((link) =>
              renderLink(
                link,
                'mobile-nav-link touch-target focus-ring-interactive flex min-h-11 items-center rounded-2xl px-3 py-3 text-sm font-semibold text-foreground/88 transition hover:bg-[color:var(--glass-surface-bg)] @sm:px-4 @sm:py-3 @sm:text-base',
                'mobile',
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
