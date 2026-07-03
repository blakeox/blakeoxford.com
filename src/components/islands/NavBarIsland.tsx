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
 * client:load
 * links={navLinks}
 * currentPath={Astro.url.pathname}
 * logo={logoConfig}
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
import { getThemePreference, updateThemeToggleButton } from '../../lib/theme';
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
 // Keep menu non-interactive until opened; initial hiding is handled by CSS/offscreen transform
 const menuEl = mobileMenuRef.current as HTMLElement;
 menuEl.style.pointerEvents = 'none';
 }

 const cleanupNav = registerModernNavBar({
 navBar: navRef.current,
 mobileMenu: mobileMenuRef.current,
 burgerButton: burgerButtonRef.current,
 closeButton: closeButtonRef.current,
 themeToggle: themeToggleRef.current
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
  updateThemeToggleButton(themeToggleRef.current, getThemePreference());
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
 <div className="@container sticky top-0 z-50 border-b border-border/40 bg-[color:var(--glass-surface-bg)] backdrop-blur supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg-xl)]">
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
 <span className="hidden text-[0.7rem] font-medium uppercase tracking-[0.16em] text-subtle-foreground sm:block">Systems architect</span>
 </span>
 </a>
 </div>

 <ul className="desktop-nav hidden gap-1 md:flex md:flex-1 md:justify-center" role="menubar">
 {links.map((link) => (
 <li className="nav-item" role="none" key={link.href}>
 <a
 href={link.href}
 role="menuitem"
                className={`nav-link focus-ring-interactive inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:text-accent ${
                  isActive(link.href)
                    ? 'bg-surface-subtle text-foreground ring-1 ring-inset ring-accent/40'
                    : 'text-foreground/90'
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
 className="nav-utility-button search-toggle"
 aria-label="Open search"
 aria-haspopup="dialog"
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

 {/* Theme cycles: light → dark → system */}
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
 <svg
 xmlns="http://www.w3.org/2000/svg"
 className="sun-icon absolute inset-0 size-6"
 data-icon="light"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth={1.8}
 focusable="false"
 >
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4 4.2 19.8m15.6-15.6-1.4 1.4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
 </svg>
 <svg
 xmlns="http://www.w3.org/2000/svg"
 className="moon-icon absolute inset-0 size-6 translate-x-px"
 data-icon="dark"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth={1.8}
 focusable="false"
 >
 <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
 </svg>
 <svg
 xmlns="http://www.w3.org/2000/svg"
 className="system-icon absolute inset-0 size-6"
 data-icon="system"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth={1.8}
 focusable="false"
 >
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
 <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" focusable="false">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
 </svg>
 </button>
 </div>
 </nav>

 <div
 ref={mobileMenuRef}
 id="nav-mobile-links"
 className="mobile-menu absolute inset-x-0 top-full z-[2147483646] border-t border-border bg-surface/98 shadow-lg md:hidden pointer-events-none motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard"
 role="dialog"
 aria-modal="true"
 aria-label="Mobile navigation menu"
 >
 {/* Close button inside mobile menu so CSS selectors for .mobile-menu.active .mobile-close-button apply */}
 <button
 id="close-mobile-menu"
 ref={closeButtonRef}
 type="button"
 className="mobile-close-button md:hidden sr-only"
 aria-label="Close navigation menu"
 />
 <div
 className="mobile-menu-content flex w-full flex-col gap-2 px-4 py-4 text-foreground @sm:gap-3 @sm:px-5 @sm:py-5"
 onClick={(e) => {
 // Prevent clicks inside the panel from being treated as outside clicks.
 e.stopPropagation();
 }}
 >
 <ul className="mobile-nav flex flex-col gap-1" role="menubar">
 {links.map((link) => (
 <li className="mobile-nav-item" role="none" key={`mobile-${link.href}`}>
 <a
 href={link.href}
 role="menuitem"
 className="mobile-nav-link touch-target focus-ring-interactive flex min-h-11 items-center rounded-2xl px-3 py-3 text-sm font-semibold text-foreground/88 transition hover:bg-[color:var(--glass-surface-bg)] @sm:px-4 @sm:py-3 @sm:text-base"
 aria-current={isActive(link.href) ? 'page' : undefined}
 >
 {link.label}
 </a>
 </li>
 ))}
 </ul>
 </div>
 </div>
 {/* Close button rendered inside the mobile menu so CSS rules targeting
 `.mobile-menu.active .mobile-close-button` apply and the button
 becomes visible when the menu is opened. */}
 
 </div>
 );
}
