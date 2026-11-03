/** Keep direct navigation discoverable under both current labels and familiar page names. */
const HUB_ALIASES: Record<string, string[]> = {
  '/': ['home'],
  '/about/': ['about'],
  '/projects/': ['projects', 'work', 'portfolio'],
  '/blog/': ['blog', 'writing'],
  '/contact/': ['contact'],
};

function aliasesForHref(href: string): string[] | undefined {
  let path: string;
  try {
    path = `${new URL(href, 'https://blakeoxford.com').pathname.replace(/\/+$/, '')}/`;
  } catch {
    return undefined;
  }
  return HUB_ALIASES[path];
}

export function isDirectHubQuery(href: string, query: string): boolean {
  return aliasesForHref(href)?.includes(query.trim().toLowerCase()) ?? false;
}

export function isNoisyHubPage(title: string, href: string, terms: string[]): boolean {
  const aliases = aliasesForHref(href);
  if (!aliases) return false;
  return !terms.some((term) =>
    [title.toLowerCase(), ...aliases].some((name) => name.includes(term))
  );
}
