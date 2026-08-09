export const SITE_ORIGIN = 'https://blakeoxford.com';
export const SEO_DESCRIPTION_MAX_LENGTH = 160;
export const NOINDEX_ROUTE_PREFIXES = ['/accessibility/', '/components/', '/design/', '/docs/'];

export function validateMetadataQuality({ title, description }) {
  const errors = [];
  if (!String(title ?? '').trim()) errors.push('title is empty');
  if (!String(description ?? '').trim()) errors.push('description is empty');
  return errors;
}

export function isNoindexRoute(pathname) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return NOINDEX_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
  );
}

export function isNoindexUrl(input) {
  const url =
    input instanceof globalThis.URL ? input : new globalThis.URL(String(input), SITE_ORIGIN);
  return url.search.length > 0 || isNoindexRoute(url.pathname);
}
