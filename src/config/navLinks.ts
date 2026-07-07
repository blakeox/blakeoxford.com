/**
 * Navigation links — derived from `src/content/navigation/nav.json`.
 * Edit nav.json; social links get external/target metadata applied here.
 */

import navJson from '../content/navigation/nav.json';

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

function withExternalMetadata(link: { href: string; label: string }): NavLink {
  const external = /^https?:\/\//.test(link.href) || link.href.startsWith('mailto:');
  return {
    href: link.href,
    label: link.label,
    ...(external ? { external: true, target: '_blank' as const } : {}),
  };
}

const navLinks: NavLink[] = navJson.links.map(withExternalMetadata);

export default navLinks;

export const navConfig: NavConfig = {
  links: navLinks,
  socialLinks: (navJson.socialLinks ?? []).map(withExternalMetadata),
};

export function getNavLinkByHref(href: string): NavLink | undefined {
  return navLinks.find((link) => link.href === href);
}

export function isCurrentPage(href: string): boolean {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return false;
  return normalizeNavPath(window.location.pathname) === normalizeNavPath(href);
}

export function getActiveNavLink(): NavLink | undefined {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return undefined;
  return navLinks.find((link) => isCurrentPage(link.href));
}
