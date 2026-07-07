import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import navLinks, { navConfig } from '../../src/config/navLinks';

type NavJson = {
  links: Array<{ href: string; label: string }>;
  socialLinks?: Array<{ href: string; label: string }>;
};

function loadNavJson(): NavJson {
  const filePath = path.join(process.cwd(), 'src/content/navigation/nav.json');
  return JSON.parse(readFileSync(filePath, 'utf8')) as NavJson;
}

function normalizeLinks(links: Array<{ href: string; label: string }>) {
  return links.map((link) => ({ href: link.href, label: link.label }));
}

describe('navLinks sync with nav.json', () => {
  const navJson = loadNavJson();

  it('keeps primary links aligned with the content collection mirror', () => {
    expect(normalizeLinks(navJson.links)).toEqual(normalizeLinks(navLinks));
  });

  it('keeps social link hrefs aligned with navConfig', () => {
    const jsonSocial = (navJson.socialLinks ?? []).map((link) => link.href).sort();
    const tsSocial = (navConfig.socialLinks ?? []).map((link) => link.href).sort();
    expect(jsonSocial).toEqual(tsSocial);
  });
});
