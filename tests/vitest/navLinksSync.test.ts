import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import navLinks, { getNavQuickLinks, navConfig } from '../../src/config/navLinks';
import { getNavQuickSearchPages } from '../../src/config/navSearchPages';

type NavJson = {
  links: Array<{ href: string; label: string }>;
  quickLinks?: Array<{ href: string; label: string }>;
  socialLinks?: Array<{ href: string; label: string }>;
};

function loadNavJson(): NavJson {
  const filePath = path.join(process.cwd(), 'src/content/navigation/nav.json');
  return JSON.parse(readFileSync(filePath, 'utf8')) as NavJson;
}

function normalizeLinks(links: Array<{ href: string; label: string }>) {
  return links.map((link) => ({ href: link.href, label: link.label }));
}

describe('navLinks derived from nav.json', () => {
  const navJson = loadNavJson();

  it('loads primary links from nav.json', () => {
    expect(normalizeLinks(navLinks)).toEqual(normalizeLinks(navJson.links));
  });

  it('loads quick links from nav.json', () => {
    expect(normalizeLinks(getNavQuickLinks())).toEqual(normalizeLinks(navJson.quickLinks ?? []));
    expect(
      getNavQuickSearchPages().map((page) => ({ href: page.href, label: page.title }))
    ).toEqual(normalizeLinks(navJson.quickLinks ?? []));
  });

  it('applies external metadata to social links from nav.json', () => {
    const jsonSocial = (navJson.socialLinks ?? []).map((link) => link.href).sort();
    const tsSocial = (navConfig.socialLinks ?? []).map((link) => link.href).sort();
    expect(tsSocial).toEqual(jsonSocial);

    for (const link of navConfig.socialLinks ?? []) {
      expect(link.external).toBe(true);
      if (/^https?:\/\//.test(link.href)) {
        expect(link.target).toBe('_blank');
      } else {
        expect(link.target).toBeUndefined();
      }
    }
  });

  it('keeps required primary routes in nav.json', () => {
    const hrefs = navJson.links.map((link) => link.href);
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/about/', '/projects/', '/blog/', '/contact/'])
    );
  });
});
