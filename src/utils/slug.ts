/**
 * Slug normalization helpers shared across search relevance and other routing logic.
 * Keeps logic central for consistent testability.
 */
export function normalizeSlug(input: string | undefined | null): string | undefined {
  if (input == null) return undefined;
  if (input === '') return '';
  return input
    .replace(/^\/+/, '')      // remove ALL leading slashes
    .replace(/index$/,'')      // strip trailing 'index'
    .replace(/\/{2,}/g, '/')  // collapse duplicate slashes globally
    ;
}

/** Ensure slug has leading slash (except empty/undefined). */
export function withLeadingSlash(s: string | undefined | null): string | undefined {
  if (!s) return undefined;
  return s.startsWith('/') ? s : '/' + s;
}
