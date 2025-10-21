# Disabling Cloudflare Zaraz

## Problem

Console shows errors for `/cdn-cgi/zaraz/s.js` returning 404 because Zaraz is attempting to load but isn't configured or enabled.

## Solution

Disable Zaraz in the Cloudflare Dashboard:

### Steps

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain: **blakeoxford.com**
3. Navigate to **Zaraz** in the left sidebar
4. Click **Settings** tab
5. Toggle **Zaraz** to **Off** or **Disabled**
6. Save changes

### Alternative: Configure Zaraz

If you want to use Cloudflare's analytics/tracking platform:

1. In Zaraz settings, click **Get Started**
2. Add tools (Google Analytics, Facebook Pixel, etc.)
3. Configure tracking events
4. Zaraz will automatically inject the script

## Current Status

- Service Worker now ignores `/cdn-cgi/` paths
- Worker passes through `/cdn-cgi/` requests to Cloudflare
- CSP allows `https://cdn-cgi/` for scripts
- Errors will persist until Zaraz is disabled or properly configured

## Why This Happens

Cloudflare may auto-enable Zaraz for new sites or after certain dashboard changes. If no tools are configured in Zaraz, the script returns 404, causing console errors.

## Impact

- **No functional impact** - the site works perfectly
- **Console noise** - shows 404 errors in developer tools
- **No SEO impact** - doesn't affect search engine visibility
