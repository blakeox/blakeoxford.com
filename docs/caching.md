# Caching Policy

This site is served by a Cloudflare Worker (`functions/edge-computing.js`) that sets explicit Cache-Control headers for performance and safety. Local `astro preview` may not reflect these headers exactly; production requests are always governed by the Worker.

## Rules by path/type

- Hashed static assets (fingerprinted) and Astro chunks
  - Paths: `/_astro/*`, any `*.{hash}.(js|css|webp|avif|svg|ico|woff2|pdf|png|jpg|jpeg)`
  - Headers: `Cache-Control: public, max-age=31536000, immutable`
- Non‑hashed static assets
  - Headers: `Cache-Control: public, max-age=86400`
- HTML documents
  - Headers: `Cache-Control: public, max-age=0, must-revalidate, stale-while-revalidate=3600`
- API endpoints (`/api/*`)
  - Headers: `Cache-Control: public, max-age=300, stale-while-revalidate=3600`
- Service Worker (`/sw.js` or `/service-worker.js`)
  - Headers: `Cache-Control: no-cache, no-store, must-revalidate`
- Web App Manifest (`/manifest.webmanifest`)
  - Headers: `Cache-Control: public, max-age=3600`
- Sitemaps & Feeds (`/sitemap.xml`, `/sitemap-index.xml`, `/sitemap-*.xml`, `/rss.xml`, `/feed.xml`)
  - Headers: `Cache-Control: public, max-age=300, no-transform`
- Search Index (`/search-index.json`)
  - Headers: `Cache-Control: public, max-age=600, stale-while-revalidate=3600`
- Robots (`/robots.txt`)
  - Headers: `Cache-Control: public, max-age=300, no-transform`

Additionally, responses include `Vary: Accept-Encoding` to avoid encoding mix-ups.

## Testing

- Playwright tests in `tests/playwright/performance/caching-strategy.spec.ts` verify:
  - At least one JS/CSS response has Cache-Control OR the hashed chunking scheme is present.
  - HTML/SW/manifest cache behavior (preview-friendly checks).
  - Reload stability.

To run only the caching tests locally:

```bash
pnpm -s test:e2e -- tests/playwright/performance/caching-strategy.spec.ts
```

## Preview vs Production

- Local `astro preview` serves assets directly; some headers may differ.
- In production, all requests pass through the Worker and receive the precise headers described above.
