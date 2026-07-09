/**
 * Search index entries derived from navLinks — single source for page search results.
 */
import navLinks, { getNavQuickLinks } from './navLinks';

export type NavSearchPage = {
  type: 'page';
  title: string;
  description: string;
  href: string;
  tags: string[];
};

const PAGE_SEARCH_META: Record<string, { description: string; tags: string[] }> = {
  '/': {
    description: 'Portfolio overview and signature programs.',
    tags: ['home', 'overview'],
  },
  '/about/': {
    description: 'Credentials, achievements, and professional journey.',
    tags: ['about', 'biography', 'achievements'],
  },
  '/projects/': {
    description: 'Selected case studies across automation, analytics, and change enablement.',
    tags: ['projects', 'case studies'],
  },
  '/blog/': {
    description: 'Articles on systems architecture, automation, and cloud strategy.',
    tags: ['blog', 'articles', 'writing'],
  },
  '/contact/': {
    description: 'Start a working session or send a note.',
    tags: ['contact', 'connect'],
  },
};

export function getNavSearchPages(): NavSearchPage[] {
  return navLinks.map((link) => {
    const meta = PAGE_SEARCH_META[link.href] ?? {
      description: link.label,
      tags: [link.label.toLowerCase()],
    };

    return {
      type: 'page',
      title: link.label,
      description: meta.description,
      href: link.href,
      tags: meta.tags,
    };
  });
}

function toNavSearchPage(link: { href: string; label: string }): NavSearchPage {
  const meta = PAGE_SEARCH_META[link.href] ?? {
    description: link.label,
    tags: [link.label.toLowerCase()],
  };

  return {
    type: 'page',
    title: link.label,
    description: meta.description,
    href: link.href,
    tags: meta.tags,
  };
}

/** Command Center quick links — sourced from nav.json `quickLinks`. */
export function getNavQuickSearchPages(): NavSearchPage[] {
  return getNavQuickLinks().map(toNavSearchPage);
}
