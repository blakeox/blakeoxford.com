# Sentry Integration Setup Guide

## Overview

This project integrates **Sentry** for error tracking and performance monitoring across three runtime environments:

1. **Browser (Client-side)** - React islands, user interactions
2. **Cloudflare Workers (Edge)** - Request handling, email sending
3. **Build-time** - Not monitored (console logs only)

**Configuration is optimized for Sentry's FREE TIER:**
- 5,000 errors/month
- 10,000 performance events/month
- 50 replay sessions/month
- 90 days data retention

---

## Quick Start

### 1. Create Sentry Account

1. Go to https://sentry.io/signup/
2. Create a free account
3. Create your organization

### 2. Create Two Projects (Recommended)

Create separate projects for better organization:

**Project 1: Browser Errors**
- Name: `blakeoxford-browser`
- Platform: `JavaScript` → `Astro`
- Get DSN from: Settings → Projects → blakeoxford-browser → Client Keys (DSN)

**Project 2: Edge Functions**
- Name: `blakeoxford-edge`
- Platform: `JavaScript` → `Node.js`
- Get DSN from: Settings → Projects → blakeoxford-edge → Client Keys (DSN)

### 3. Configure Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your browser DSN to `.env.local`:
   ```bash
   PUBLIC_SENTRY_DSN=https://your-public-key@o0000000.ingest.us.sentry.io/0000000
   PUBLIC_GIT_COMMIT=dev
   ```

3. Test locally:
   ```bash
   pnpm dev
   ```

### 4. Configure Production (Cloudflare Workers)

Set secrets via Wrangler CLI:

```bash
# Edge function DSN
wrangler secret put SENTRY_DSN_EDGE
# Paste your blakeoxford-edge DSN when prompted

# Environment
wrangler secret put ENVIRONMENT
# Type: production

# Git commit (set automatically in CI/CD)
wrangler secret put GIT_COMMIT
# For manual: $(git rev-parse HEAD)
```

### 5. (Optional) Enable Source Maps

For readable stack traces in production:

1. Create Sentry auth token:
   - Go to: https://sentry.io/settings/account/api/auth-tokens/
   - Create New Token
   - Scopes: `project:releases`, `project:write`

2. Set as environment variable:
   ```bash
   # Cloudflare secret
   wrangler secret put SENTRY_AUTH_TOKEN
   
   # Or in CI/CD environment
   export SENTRY_AUTH_TOKEN=sntrys_your_token_here
   export SENTRY_ORG=your-org-slug
   export SENTRY_PROJECT=blakeoxford-browser
   ```

3. Upload source maps after build:
   ```bash
   pnpm build:prod
   pnpm sentry:sourcemaps
   ```

---

## Configuration Files

### `sentry.client.config.ts`
Browser/client-side configuration with:
- 10% performance tracing (free tier optimization)
- 5% normal session replays, 50% error session replays
- Privacy protections (mask text, block media, scrub PII)
- Bot/crawler filtering
- Development mode filtering

### `sentry.edge.config.js`
Cloudflare Workers configuration with:
- 5% performance tracing (edge handles high traffic)
- Cloudflare context (colo, country, city, ASN)
- Bot/crawler filtering
- Helper functions for error capture

### `src/components/ErrorBoundary.tsx`
React Error Boundary component:
- Catches React component errors
- Reports to Sentry with component context
- Shows user-friendly error UI
- Dev mode error details

---

## Usage Examples

### Wrapping React Components

```typescript
import { ErrorBoundary } from '../ErrorBoundary';

export default function MyIsland() {
  return (
    <ErrorBoundary 
      componentName="MyIsland"
      fallback={<p>Something went wrong</p>}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Manual Error Capture (Browser)

```typescript
import * as Sentry from '@sentry/astro';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'contact-form' },
    extra: { userId: '123' },
  });
}
```

### Manual Error Capture (Edge)

```javascript
import { captureEdgeException, addEdgeBreadcrumb } from '../sentry.edge.config.js';

// Add breadcrumb
addEdgeBreadcrumb({
  category: 'email',
  message: 'Sending contact form email',
  level: 'info',
});

// Capture error
try {
  await sendEmail();
} catch (error) {
  captureEdgeException(error, {
    tags: { function: 'send-email' },
    extra: { recipient: '[EMAIL]' }, // Scrub PII
  });
}
```

---

## Sample Rates & Free Tier Optimization

### Current Configuration

**Browser (sentry.client.config.ts):**
```typescript
tracesSampleRate: 0.1,           // 10% of transactions
replaysSessionSampleRate: 0.05,  // 5% of normal sessions
replaysOnErrorSampleRate: 0.5,   // 50% of error sessions
```

**Edge (sentry.edge.config.js):**
```javascript
tracesSampleRate: 0.05,  // 5% of requests
```

### Adjusting Sample Rates

If you're **under your quota**, increase rates for more visibility:

```typescript
// More aggressive sampling
tracesSampleRate: 0.2,           // 20%
replaysSessionSampleRate: 0.1,   // 10%
```

If you're **over your quota**, decrease rates:

```typescript
// Conservative sampling
tracesSampleRate: 0.05,          // 5%
replaysSessionSampleRate: 0.01,  // 1%
```

### Monitoring Quota Usage

1. Go to: https://sentry.io/settings/[your-org]/billing/
2. Check: Usage & Billing
3. Monitor: Errors, Transactions, Replays

---

## Privacy & Security

### Configured Protections

✅ **Mask all user text** in session replays  
✅ **Block media** (images/videos) in replays  
✅ **Scrub emails and PII** from breadcrumbs  
✅ **Remove cookies and auth headers** from events  
✅ **Filter bot/crawler traffic** (saves quota)  
✅ **Development events not sent** to Sentry  

### Additional Privacy Options

Add to `sentry.client.config.ts` for stricter privacy:

```typescript
beforeSend(event) {
  // Scrub specific fields
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }
  
  // Scrub URLs with sensitive params
  if (event.request?.url) {
    event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]');
  }
  
  return event;
}
```

---

## Build Scripts

### Development
```bash
pnpm dev              # Start dev server (Sentry disabled)
```

### Production Build
```bash
pnpm build:prod       # Build with git commit tracking
pnpm sentry:sourcemaps # Upload source maps (requires auth token)
```

### Deployment
```bash
pnpm edge:deploy      # Deploy Cloudflare Worker with Sentry
```

---

## Troubleshooting

### Events Not Appearing

1. **Check DSN**: Verify `PUBLIC_SENTRY_DSN` in `.env.local`
2. **Check environment**: Sentry only sends in production (`NODE_ENV=production`)
3. **Check console**: Look for "Sentry event (dev only)" logs in dev mode
4. **Check quota**: Verify you haven't exceeded free tier limits
5. **Check filters**: Events might be filtered by `ignoreErrors` or `beforeSend`

### Source Maps Not Working

1. **Auth token**: Verify `SENTRY_AUTH_TOKEN` has correct permissions
2. **Project/Org**: Check `SENTRY_PROJECT` and `SENTRY_ORG` variables
3. **Release matching**: Ensure `PUBLIC_GIT_COMMIT` matches uploaded release
4. **Upload script**: Run `pnpm sentry:sourcemaps` after build

### High Quota Usage

1. **Lower sample rates**: See "Sample Rates & Free Tier Optimization" above
2. **Add more filters**: Update `ignoreErrors` array for known noise
3. **Filter bots**: Enhance bot detection in `beforeSendTransaction`
4. **Check spam**: Look for repeated errors that could be filtered

### Edge Function Errors Not Captured

1. **Secrets**: Verify `wrangler secret list` shows `SENTRY_DSN_EDGE`
2. **Initialization**: Check `initEdgeSentry()` is called at function start
3. **Import**: Verify edge functions import `sentry.edge.config.js`

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build with Sentry
  env:
    PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN_BROWSER }}
    PUBLIC_GIT_COMMIT: ${{ github.sha }}
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: blakeoxford-browser
    NODE_ENV: production
  run: |
    pnpm build:prod
    pnpm sentry:sourcemaps
```

### Cloudflare Pages/Workers

Set environment variables in Cloudflare dashboard:
- Navigate to: Workers & Pages → Your Worker → Settings → Variables
- Add: `PUBLIC_SENTRY_DSN`, `PUBLIC_GIT_COMMIT`
- Use Secrets for: `SENTRY_DSN_EDGE`, `SENTRY_AUTH_TOKEN`

---

## Support & Resources

- **Sentry Docs**: https://docs.sentry.io/
- **Astro Integration**: https://docs.sentry.io/platforms/javascript/guides/astro/
- **Cloudflare Workers**: https://docs.sentry.io/platforms/javascript/guides/cloudflare-workers/
- **Free Tier Limits**: https://sentry.io/pricing/
- **Status Page**: https://status.sentry.io/

---

## Upgrading from Free Tier

If you need more capacity:

**Team Plan ($26/month)**
- 50K errors/month
- 100K performance events/month
- 500 replay sessions/month
- 1 year data retention
- Team collaboration features

**Business Plan ($80/month)**
- 150K errors/month
- 300K performance events/month
- 1,500 replay sessions/month
- 2 years data retention
- Advanced features (priority support, custom retention)
