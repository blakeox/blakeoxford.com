import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SITE_ORIGIN = 'https://blakeoxford.com';
const dimensionsCache = new Map();

function localAssetPath(source) {
  let parsed;
  try {
    parsed = new globalThis.URL(source, SITE_ORIGIN);
  } catch {
    return null;
  }

  if (parsed.origin !== SITE_ORIGIN) return null;

  const { pathname } = parsed;
  if (!pathname.startsWith('/') || pathname.includes('..')) return null;

  const relativePath = pathname.slice(1);
  const candidates = [path.resolve('public', relativePath), path.resolve('dist', relativePath)];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/**
 * Return the dimensions for a local social image, or null for remote/missing assets.
 * Public assets are checked first so this works during Astro's build before dist is complete.
 */
export async function getLocalImageDimensions(source) {
  if (typeof source !== 'string' || source.length === 0) return null;
  if (dimensionsCache.has(source)) return dimensionsCache.get(source);

  const assetPath = localAssetPath(source);
  if (!assetPath) {
    dimensionsCache.set(source, null);
    return null;
  }

  try {
    const metadata = await sharp(assetPath).metadata();
    const dimensions =
      metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : null;
    dimensionsCache.set(source, dimensions);
    return dimensions;
  } catch {
    dimensionsCache.set(source, null);
    return null;
  }
}

export const DEFAULT_SOCIAL_IMAGE_DIMENSIONS = Object.freeze({ width: 1200, height: 630 });
