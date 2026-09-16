import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/** Skip logo-sized placeholders that read as empty frames. */
const MIN_PREVIEW_BYTES = 8_192;

/** Project PNGs are diagrams / mint clip-art, not photography. */
const NON_PHOTOGRAPHIC_PREFIXES = ['/assets/projects/'];

function isPhotographicCandidate(src: string): boolean {
  return !NON_PHOTOGRAPHIC_PREFIXES.some((prefix) => src.startsWith(prefix));
}

/** True when a site-root path exists under `public/` and is large enough to read as media. */
export function publicAssetExists(src: string, cwd = process.cwd()): boolean {
  if (!src.startsWith('/')) return false;
  const file = resolve(cwd, 'public', src.replace(/^\//, ''));
  if (!existsSync(file)) return false;
  try {
    return statSync(file).size >= MIN_PREVIEW_BYTES;
  } catch {
    return false;
  }
}

/** First existing photographic public image, otherwise undefined — never a blank or diagram frame. */
export function resolvePublicImage(
  src: string | undefined,
  fallback?: string,
  cwd = process.cwd()
): string | undefined {
  if (src && isPhotographicCandidate(src) && publicAssetExists(src, cwd)) return src;
  if (fallback && isPhotographicCandidate(fallback) && publicAssetExists(fallback, cwd)) {
    return fallback;
  }
  return undefined;
}
