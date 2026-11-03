/** Keep direct navigation discoverable under both current labels and familiar page names. */
const HUB_ALIASES: Record<string, string[]> = {
  '/': ['home'],
  '/about/': ['about'],
  '/projects/': ['projects', 'work', 'portfolio'],
  '/blog/': ['blog', 'writing'],
  '/contact/': ['contact'],
};

export function isNoisyHubPage(title: string, href: string, terms: string[]): boolean {
  let path: string;
  try {
    path = `${new URL(href, 'https://blakeoxford.com').pathname.replace(/\/+$/, '')}/`;
  } catch {
    return false;
  }
  const aliases = HUB_ALIASES[path];
  if (!aliases) return false;
  return !terms.some((term) =>
    [title.toLowerCase(), ...aliases].some((name) => name.includes(term))
  );
}
