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
  socialLinks: []
};

// Utility functions for navigation
export function getNavLinkByHref(href: string): NavLink | undefined {
  return navLinks.find(link => link.href === href);
}

export function isCurrentPage(href: string): boolean {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return false;
  return window.location.pathname === href;
}

export function getActiveNavLink(): NavLink | undefined {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return undefined;
  return navLinks.find(link => isCurrentPage(link.href));
} 