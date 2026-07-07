/**
 * NavBarIsland - React island for site navigation
 *
 * Interactive navigation bar with mobile menu, logo, and responsive design.
 * Mobile menu state lives in useMobileMenu; theme toggle uses registerNavTheme.
 */
import { useEffect, useRef, useState } from 'react';

import type { NavLink } from '../../config/navLinks';
import { normalizeNavPath } from '../../config/navLinks';
import { useMobileMenu } from '../../features/nav/hooks/useMobileMenu';
import { openCommandCenter } from '../../features/command-center/lib/commandEvents';
import { registerModernNavBar } from '../../scripts/features/ModernNavBar';
import { registerHeaderOverlayLifecycle } from '../../scripts/features/registerHeaderOverlayLifecycle';
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
  const mobileBackdropRef = useRef<HTMLDivElement | null>(null);
  const burgerButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuStatusRef = useRef<HTMLDivElement | null>(null);
  const themeToggleRef = useRef<HTMLButtonElement | null>(null);

  const [activePath, setActivePath] = useState(() => normalizeNavPath(currentPath));

  const { isOpen, burgerLabel, onBurgerClick, onBackdropClick, onMenuLinkClick } = useMobileMenu({
    menu: mobileMenuRef,
    backdrop: mobileBackdropRef,
    burger: burgerButtonRef,
    status: menuStatusRef,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      (window as typeof window & { __navHydrated?: boolean }).__navHydrated = true;

      const syncActivePath = () => setActivePath(normalizeNavPath(window.location.pathname));
      syncActivePath();
      document.addEventListener('astro:page-load', syncActivePath);

      const cleanupNav = registerModernNavBar({
        navBar: navRef.current,
        themeToggle: themeToggleRef.current,
      });

      const cleanupOverlayLifecycle = registerHeaderOverlayLifecycle();

      if (!(window as typeof window & { __motionAccessibilityInit?: boolean }).__motionAccessibilityInit) {
        initMotionAccessibility();
        (window as typeof window & { __motionAccessibilityInit?: boolean }).__motionAccessibilityInit = true;
      }

      const navEl = navRef.current;
      const shellEl = shellRef.current;
      const handleScroll = () => {
        if (!navEl) return;
        const scrolled = window.scrollY > 80;
        navEl.classList.toggle('has-background', scrolled);
        shellEl?.classList.toggle('nav-shell--scrolled', scrolled);
      };
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        cleanupNav?.();
        cleanupOverlayLifecycle?.();
        document.removeEventListener('astro:page-load', syncActivePath);
        window.removeEventListener('scroll', handleScroll);
      };
    } catch (err) {
      console.error('[NavBarIsland] hydration error', err);
    }
  }, []);

  useEffect(() => {
    const menu = mobileMenuRef.current;
    if (menu) menu.inert = !isOpen;
  }, [isOpen]);

  const isActive = (href: string): boolean => {
    if (!href.startsWith('/')) return false;
    return normalizeNavPath(href) === normalizeNavPath(activePath);
  };

  const renderLink = (link: NavLink, className: string, keyPrefix: string, onNavigate?: () => void) => {
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
          onClick={onNavigate}
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
      data-menu-state={isOpen ? 'open' : 'closed'}
    >
      <div
        id="nav-menu-status"
        ref={menuStatusRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <nav
        id="navbar"
        ref={navRef}
        className="relative z-10 mx-auto flex h-[var(--nav-height,4.5rem)] w-full max-w-container-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-foreground motion-safe:transition-[height,box-shadow] motion-safe:duration-normal"
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
                loading="eager"
                fetchPriority="high"
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
          <a
            href="/contact/"
            className="nav-cta-button hidden md:inline-flex"
          >
            Contact
          </a>

          <button
            id="search-toggle"
            type="button"
            className="nav-utility-button search-toggle gap-1.5 px-3"
            aria-label="Open site search (Command K)"
            aria-haspopup="dialog"
            aria-expanded="false"
            onClick={() => openCommandCenter()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
            <span className="hidden text-xs font-medium text-muted-foreground lg:inline">Search</span>
            <kbd className="nav-kbd hidden lg:inline-flex">⌘K</kbd>
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
            className={`nav-utility-button burger-menu-button md:hidden${isOpen ? ' active' : ''}`}
            aria-label={burgerLabel}
            aria-controls="nav-mobile-links"
            aria-expanded={isOpen}
            onClick={onBurgerClick}
          >
            <span className="burger-icon" aria-hidden="true">
              <span className="burger-line" />
              <span className="burger-line" />
              <span className="burger-line" />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="nav-mobile-backdrop"
        ref={mobileBackdropRef}
        className="mobile-menu-backdrop md:hidden"
        data-state={isOpen ? 'open' : 'closed'}
        aria-hidden={isOpen ? 'false' : 'true'}
        onClick={onBackdropClick}
      />

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
        className={`mobile-menu border-t border-border bg-surface/98 shadow-lg md:hidden${isOpen ? ' active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-mobile-menu-title"
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div
          className="mobile-menu-content flex w-full flex-col gap-2 px-4 py-4 text-foreground @sm:gap-3 @sm:px-5 @sm:py-5"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="nav-mobile-menu-title" className="sr-only">
            Site navigation
          </h2>
          <ul className="mobile-nav flex flex-col gap-1">
            {links.map((link) =>
              renderLink(
                link,
                'mobile-nav-link touch-target focus-ring-interactive flex min-h-11 items-center rounded-2xl px-3 py-3 text-sm font-semibold text-foreground/88 transition hover:bg-[color:var(--glass-surface-bg)] @sm:px-4 @sm:py-3 @sm:text-base',
                'mobile',
                onMenuLinkClick,
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
