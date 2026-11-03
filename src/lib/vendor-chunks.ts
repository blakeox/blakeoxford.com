/**
 * Client vendor groups for Rolldown.
 *
 * A catch-all "vendor" chunk is intentionally absent. Sentry depends on zod, so
 * any catch-all that also contains React is downloaded with the SDK. Pages that
 * never mount an island were loading both.
 */
export type VendorChunkName = 'vendor-react' | 'vendor-sentry' | 'vendor-zod';

const REACT_PACKAGE = /\/node_modules\/(?:react|react-dom|scheduler)\//;
const ZOD_PACKAGE = /\/node_modules\/zod\//;
const SENTRY_PACKAGE = '/node_modules/@sentry/';

export function vendorChunkName(id: string): VendorChunkName | undefined {
  const normalized = id.replaceAll('\\', '/');
  // Virtual ids (for example "\0astro:react:opts") are not packages.
  if (normalized.includes('\0') || !normalized.includes('/node_modules/')) return undefined;
  if (REACT_PACKAGE.test(normalized)) return 'vendor-react';
  if (normalized.includes(SENTRY_PACKAGE)) return 'vendor-sentry';
  if (ZOD_PACKAGE.test(normalized)) return 'vendor-zod';
  return undefined;
}
