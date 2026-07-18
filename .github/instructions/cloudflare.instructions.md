---
description: Cloudflare edge computing patterns and Workers development
applyTo: 'functions/**'
---

# Cloudflare Edge Instructions

Guidelines for developing and deploying Cloudflare Workers, Durable Objects, and edge computing features.

---

## 1. Workers Architecture

### Entry Point

- **Main Worker**: `functions/edge-computing.js`
- **Email Handler**: `functions/send-email.js`
- **Durable Object**: `functions/ConversationDO.js`
- **Configuration**: `wrangler.toml`

### Bindings

All bindings configured in `wrangler.toml`:

#### Assets
- `ASSETS` - Serves static build from `./dist`
- `run_worker_first = true` - Worker handles routing first

#### KV Namespaces
- `RATE_LIMIT_KV` - Rate limiting data
- `CONTACT_MESSAGES` - Contact form submissions
- `AI_RESPONSE_CACHE` - Cached AI responses
- `AI_FEEDBACK_KV` - User feedback on AI responses

#### Durable Objects
- `CONVERSATION_DO` - Stateful conversation management
- Class: `ConversationDurableObject`

#### AI Services
- `AI` - Workers AI binding for on-edge inference
- `VECTORIZE` - Semantic search index (`blakeoxford-content`)
- `AI_ANALYTICS` - Analytics Engine dataset

---

## 2. Edge Caching Strategy

### Cache Manager

Located in `functions/edge-computing.js`:

```javascript
class EdgeCacheManager {
  getCacheStrategy() {
    // Returns { ttl, headers } based on path
  }
}
```

### Tiered TTL Strategy

#### Immutable Assets (Hashed)
- Pattern: Files with content hashes
- TTL: 31536000 seconds (1 year)
- Header: `Cache-Control: public, max-age=31536000, immutable`

#### Static Assets (Unhashed)
- Extensions: `.js`, `.css`, `.png`, `.jpg`, `.webp`, `.avif`, `.svg`, `.ico`, `.woff2`
- TTL: 86400 seconds (24 hours)
- Header: `Cache-Control: public, max-age=86400`

#### HTML Pages
- TTL: 3600 seconds (1 hour)
- Header: `Cache-Control: public, max-age=3600, must-revalidate`

#### API Routes
- TTL: 300 seconds (5 minutes)
- Header: `Cache-Control: public, max-age=300, stale-while-revalidate=3600`

#### Special Files
- `robots.txt`: 86400s
- `sitemap.xml`: 3600s
- `manifest.webmanifest`: 86400s
- `search-index.json`: 1800s with SWR
- Service workers: No cache

---

## 3. Security Headers

### Content Security Policy (CSP)

Implemented in `functions/edge-computing.js`:

```javascript
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'nonce-{NONCE}' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://cloudflare-workers.blakeoxford.com",
  "frame-src https://challenges.cloudflare.com",
  // ... full policy in code
].join('; ');
```

### Other Security Headers

```javascript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'SAMEORIGIN'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
```

---

## 4. Rate Limiting

### Per-IP Rate Limiting

```javascript
const ipKey = `ratelimit:ip:${clientIP}`;
const ipLimit = 10; // requests per 2 minutes
```

### Per-Session Rate Limiting

```javascript
const sessionKey = `ratelimit:session:${sessionId}`;
const sessionLimit = 5; // requests per 2 minutes
```

### Implementation

- Storage: `RATE_LIMIT_KV`
- Window: 120 seconds
- Response: 429 with `Retry-After` header
- Headers: `x-rate-limit-remaining`, `x-rate-limit-reason`

---

## 5. Durable Objects

### ConversationDurableObject

**Purpose**: Stateful AI chat with WebSocket support

**Features**:
- Real-time WebSocket connections
- Typing indicators
- User presence tracking
- Conversation persistence
- Per-user rate limiting

**Key Methods**:
```javascript
class ConversationDurableObject {
  async fetch(request) { }          // HTTP/WebSocket entry
  async handleWebSocket(request) { } // WebSocket upgrade
  async handlePostMessage(request) { } // HTTP fallback
  broadcast(message, excludeSession) { } // Fan-out
}
```

**WebSocket Messages**:
- `init` - Initial state sync
- `message` - Chat message
- `typing` - Typing indicator
- `presence` - User join/leave
- `error` - Error notification

---

## 6. Workers AI Integration

### On-Edge Inference

```javascript
const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
  messages: conversationHistory,
  max_tokens: 500
});
```

### Vectorize Semantic Search

```javascript
const vectorResults = await env.VECTORIZE.query(queryVector, {
  topK: 5,
  returnMetadata: true
});
```

### Analytics Tracking

```javascript
env.AI_ANALYTICS.writeDataPoint({
  blobs: ['query_text'],
  doubles: [responseTime],
  indexes: [sessionId]
});
```

---

## 7. Error Handling & Monitoring

### Sentry Integration

```javascript
import { initEdgeSentry, addEdgeBreadcrumb } from '../sentry.edge.config.js';

const sentry = initEdgeSentry(env, request);

try {
  // Edge logic
} catch (error) {
  sentry.captureException(error);
}
```

### Error Response Pattern

```javascript
return new Response(JSON.stringify({ 
  error: 'Description',
  code: 'ERROR_CODE' 
}), {
  status: 500,
  headers: { 'Content-Type': 'application/json' }
});
```

---

## 8. Development & Deployment

### Local Development

```bash
pnpm dev  # Starts Astro with AI search proxy
```

**Note**: Dev proxy in `astro.config.mjs` handles `/api/ai-search` during development

### Deployment

```bash
pnpm deploy:worker       # Deploy to Cloudflare
pnpm edge:deploy         # Alternative command
pnpm edge:validate       # Validate configuration
```

### Environment Variables

Set via `wrangler secret put`:

- `SENTRY_DSN_EDGE` - Edge error tracking
- `SENTRY_AUTH_TOKEN` - Source map uploads
- `AI_SEARCH_API_TOKEN` - AI search authentication
- `CONTACT_EMAIL` - Cloudflare Email Service binding configured in `wrangler.toml`
- `GIT_COMMIT` - Deployment version
- `ENVIRONMENT` - Deployment environment

### Configuration

In `wrangler.toml`:

```toml
[vars]
AI_SEARCH_API_ENDPOINT = "https://..."
ENVIRONMENT = "production"
```

---

## 9. Best Practices

### Performance

- Minimize synchronous KV reads
- Use `waitUntil()` for non-blocking operations
- Cache responses at the edge
- Implement stale-while-revalidate for API routes

### Security

- Validate all inputs before processing
- Use nonce-based CSP for inline scripts
- Implement rate limiting on all user-facing endpoints
- Store secrets via `wrangler secret put`, never in code

### Reliability

- Handle KV read/write failures gracefully
- Implement fallbacks for AI service outages
- Use Durable Objects for critical state
- Monitor error rates via Sentry

### Testing

- Test Workers locally with `wrangler dev`
- Validate edge configuration: `pnpm edge:validate`
- Test rate limiting behavior
- Verify CSP headers in production

---

## 10. API Endpoints

### Contact Form

- Route: `/api/send-email`
- Handler: `functions/send-email.js`
- Rate limited: Yes
- Storage: `CONTACT_MESSAGES` KV

---

## 11. Compatibility Flags

In `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"]
```

Required for:
- `@sentry/cloudflare` (uses Node.js built-ins)
- Buffer polyfills
- Crypto utilities

---

## GitHub Actions Deploy

The `Deploy Worker` workflow (`.github/workflows/deploy-worker.yml`) runs on pushes to `main` using `cloudflare/wrangler-action@v3`.

Required GitHub configuration:
- **Secret** `CLOUDFLARE_API_TOKEN` — API token with Workers deploy permissions
- **Variable** `CLOUDFLARE_ACCOUNT_ID` — `cc3bb24ae3c87cff38c2be85df3dab29` (also in `wrangler.toml`)

Bootstrap or rotate credentials:

```bash
# Preferred: dedicated API token from Cloudflare dashboard
CLOUDFLARE_API_TOKEN='your-token' ./scripts/setup/github-cloudflare-deploy.sh

# Quick bootstrap from local wrangler login (rotate to a dedicated token later)
./scripts/setup/github-cloudflare-deploy.sh --from-wrangler
```

Manual deploy trigger:

```bash
gh workflow run deploy-worker.yml
```

Cloudflare Git integration also builds on push; the GitHub Action provides an explicit Wrangler deploy path when the secret is configured.

---

## Reference Documents

- `wrangler.toml` - Worker configuration
- `functions/edge-computing.js` - Main Worker
- `functions/ConversationDO.js` - Durable Object implementation
- `src/config/constants.ts` - Cache durations and constants
- Cloudflare Docs: https://developers.cloudflare.com/workers/
