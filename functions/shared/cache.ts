import { CACHE_DURATIONS, isHashedPath } from '../../src/config/constants.ts';
import type { Env } from '../types';

export class EdgeCacheManager {
  request: Request;
  env: Env;
  url: URL;

  constructor(request: Request, env: Env) {
    this.request = request;
    this.env = env;
    this.url = new URL(request.url);
  }

  getCacheStrategy(): { ttl: number; headers: Record<string, string> } {
    const path = this.url.pathname;
    const lower = path.toLowerCase();
    const extension = lower.split('.').pop();

    // Text files with special semantics
    if (lower === '/robots.txt') {
      return {
        ttl: CACHE_DURATIONS.pages.robots,
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATIONS.pages.robots}, no-transform`,
        },
      };
    }
    if (lower === '/sw.js' || lower === '/service-worker.js') {
      // Ensure clients revalidate on each navigation to pick up new SW quickly
      return { ttl: 0, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } };
    }
    if (lower.endsWith('/manifest.webmanifest') || lower === '/manifest.webmanifest') {
      return {
        ttl: CACHE_DURATIONS.pages.manifest,
        headers: { 'Cache-Control': `public, max-age=${CACHE_DURATIONS.pages.manifest}` },
      };
    }
    if (
      lower.endsWith('/sitemap.xml') ||
      lower.endsWith('/sitemap-index.xml') ||
      /\/sitemap-\d+\.xml$/.test(lower) ||
      lower.endsWith('/rss.xml') ||
      lower.endsWith('/feed.xml')
    ) {
      return {
        ttl: CACHE_DURATIONS.pages.sitemap,
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATIONS.pages.sitemap}, no-transform`,
        },
      };
    }
    if (lower.endsWith('/search-index.json')) {
      const ttl = CACHE_DURATIONS.pages.searchIndex;
      return {
        ttl,
        headers: { 'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=3600` },
      };
    }

    // APIs
    if (lower.startsWith('/api/')) {
      const ttl = CACHE_DURATIONS.api.default;
      return {
        ttl,
        headers: { 'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=3600` },
      };
    }

    // Static assets
    if (
      ['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'svg', 'ico', 'woff2', 'pdf'].includes(
        extension || ''
      )
    ) {
      if (isHashedPath(lower)) {
        const ttl = CACHE_DURATIONS.static.hashed;
        return { ttl, headers: { 'Cache-Control': `public, max-age=${ttl}, immutable` } };
      }
      // Non-hashed assets: cache, but allow periodic refresh
      const ttl = CACHE_DURATIONS.assets.default;
      return { ttl, headers: { 'Cache-Control': `public, max-age=${ttl}` } };
    }

    // HTML and everything else: prefer freshness at the browser with CDN leeway
    const ttl = CACHE_DURATIONS.pages.html;
    return {
      ttl,
      headers: {
        'Cache-Control': `public, max-age=0, must-revalidate, stale-while-revalidate=${CACHE_DURATIONS.pages.htmlStaleWhileRevalidate}`,
      },
    };
  }
}
