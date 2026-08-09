/**
 * Search index entries derived from navLinks — single source for page search results.
 */
import navLinks, { getNavQuickLinks } from './navLinks';
import pageSearchMeta from './nav-search-pages.json';

export type NavSearchPage = {
  type: 'page';
  title: string;
  description: string;
  href: string;
  tags: string[];
};

const PAGE_SEARCH_META = Object.fromEntries(
  pageSearchMeta.map((page) => [page.href, { description: page.description, tags: page.tags }])
);

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
