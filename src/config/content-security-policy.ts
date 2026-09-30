/**
 * Site Content-Security-Policy (also mirrored in `_headers` for static asset responses).
 * Keep both in sync when updating.
 */
export const CONTENT_SECURITY_POLICY =
  'default-src \'self\'; ' +
  'img-src \'self\' data: https:; ' +
  'script-src \'self\' \'unsafe-inline\' https://www.clarity.ms https://static.cloudflareinsights.com https://www.googletagmanager.com https://challenges.cloudflare.com; ' +
  'style-src \'self\' \'unsafe-inline\' https://challenges.cloudflare.com; ' +
  'font-src \'self\' data:; ' +
  'connect-src \'self\' https://www.clarity.ms https://*.clarity.ms https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com; ' +
  'frame-src https://challenges.cloudflare.com https://www.googletagmanager.com; ' +
  'worker-src \'self\'; ' +
  'manifest-src \'self\'';
