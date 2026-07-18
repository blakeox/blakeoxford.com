/**
 * Slug normalization helpers (ESM JS)
 * Mirrors src/utils/slug.ts so Node scripts can import without TS loaders.
 */
export function normalizeSlug(input) {
  if (input == null) return undefined;
  if (input === '') return '';
  return String(input)
    .replace(/^\/+/, '') // remove ALL leading slashes
    .replace(/index$/, '') // strip trailing 'index'
    .replace(/\/{2,}/g, '/'); // collapse duplicate slashes globally
}

// Ensure slug has leading slash (except empty/undefined)
export function withLeadingSlash(s) {
  if (!s) return undefined;
  return s.startsWith('/') ? s : '/' + s;
}
