/**
 * Navigation Links Configuration
 * TypeScript version with proper interfaces
 */

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  target?: string;
}

/** Normalize paths for active-link and aria-current comparisons. */
export function normalizeNavPath(path: string): string {
  if (!path) return '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

export interface NavConfig {
  links: NavLink[];
  socialLinks?: NavLink[];
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about/', label: 'About' },
  { href: '/projects/', label: 'Projects' },
  { href: '/blog/', label: 'Blog' },
  { href: '/contact/', label: 'Contact' },
];

export default navLinks;

// Export configuration object for future extensibility
export const navConfig: NavConfig = {
  links: navLinks,
  socialLinks: [
    { href: 'https://github.com/blakeox', label: 'GitHub', external: true, target: '_blank' },
    { href: 'https://linkedin.com/in/blake-oxford', label: 'LinkedIn', external: true, target: '_blank' },
    { href: 'mailto:hello@blakeoxford.com', label: 'Email', external: true },
  ],
};

// Utility functions for navigation
export function getNavLinkByHref(href: string): NavLink | undefined {
  return navLinks.find(link => link.href === href);
}

export function isCurrentPage(href: string): boolean {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return false;
  return normalizeNavPath(window.location.pathname) === normalizeNavPath(href);
}

export function getActiveNavLink(): NavLink | undefined {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return undefined;
  return navLinks.find((link) => isCurrentPage(link.href));
} 