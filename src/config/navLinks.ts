/**
 * Navigation Links Configuration
 * TypeScript version with proper interfaces
 */

export interface NavLink {
  href: string;
  label: string;
  analytics: string;
  external?: boolean;
  target?: string;
}

export interface NavConfig {
  links: NavLink[];
  socialLinks?: NavLink[];
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home', analytics: 'nav-home' },
  { href: '/about/', label: 'About', analytics: 'nav-about' },
  { href: '/projects/', label: 'Projects', analytics: 'nav-projects' },
  { href: '/blog/', label: 'Blog', analytics: 'nav-blog' },
  { href: '/contact/', label: 'Contact', analytics: 'nav-contact' },
  // No social links in header
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

export function getNavLinkByAnalytics(analytics: string): NavLink | undefined {
  return navLinks.find(link => link.analytics === analytics);
}

export function isCurrentPage(href: string): boolean {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return false;
  return window.location.pathname === href;
}

export function getActiveNavLink(): NavLink | undefined {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return undefined;
  return navLinks.find(link => isCurrentPage(link.href));
} 