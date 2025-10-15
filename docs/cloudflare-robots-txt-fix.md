# Cloudflare robots.txt Managed Content Issue

## Problem

Lighthouse reports `robots.txt is not valid` with error on line 29: `Content-signal: search=yes,ai-train=no` - "Unknown directive"

## Root Cause

Cloudflare's **Bot Fight Mode** injects managed content into `robots.txt` responses at the CDN edge level. This happens **after** our Worker serves the response, so we cannot prevent it programmatically.

The injected content includes:

- Extended `Content-signal` directives (proposed standard, not yet official)
- User-agent blocks for AI crawlers (GPTBot, ClaudeBot, etc.)

## Solution

To fix the Lighthouse validation error, disable Bot Fight Mode in Cloudflare Dashboard:

1. Log in to Cloudflare Dashboard
2. Navigate to **Security** → **Bots**
3. Find **Bot Fight Mode** setting
4. Toggle it **OFF**

## Alternative: Accept as-is

The `Content-signal` directive is a **proposed standard** for controlling AI training on website content:

- `search=yes` - Allow search indexing
- `ai-train=no` - Disallow AI model training

While not yet in the official robots.txt spec, this is:

- ✅ Forward-thinking content protection
- ✅ Doesn't harm actual SEO (Google/Bing ignore unknown directives)
- ❌ Fails Lighthouse validator (strict spec compliance)

## Impact

- **SEO Impact**: None - search engines ignore unknown directives
- **Lighthouse Score**: Reduces SEO category score by ~8 points
- **Real-world Impact**: Minimal - the directive serves a valid purpose

## Current Status

Our Worker at `functions/edge-computing.js` serves clean robots.txt, but Cloudflare CDN edge adds managed content afterward.

## Testing

Check production robots.txt:

```bash
curl -s https://blakeoxford.com/robots.txt
```

Check local/Worker output (without CDN injection):

```bash
curl -s http://localhost:4321/robots.txt
```
