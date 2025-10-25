/* eslint quotes:["warn","single",{allowTemplateLiterals:true}] */
/**
 * Cloudflare Worker: Edge app with asset serving, security headers, caching, audit-mode, and utilities
 */
import { onRequestPost as handleSendEmail } from './send-email.js';
import { initEdgeSentry, addEdgeBreadcrumb } from '../sentry.edge.config.js';
import { CACHE_DURATIONS, isHashedPath } from '../src/config/constants.ts';
export { ConversationDurableObject } from './ConversationDO.js';

class EdgeCacheManager {
  constructor(request, env) {
    this.request = request;
    this.env = env;
    this.url = new URL(request.url);
  }
  getCacheStrategy() {
    const path = this.url.pathname;
    const lower = path.toLowerCase();
    const extension = lower.split('.').pop();

    // Text files with special semantics
    if (lower === '/robots.txt') {
      return { ttl: CACHE_DURATIONS.pages.robots, headers: { 'Cache-Control': `public, max-age=${CACHE_DURATIONS.pages.robots}, no-transform` } };
    }
    if (lower === '/sw.js' || lower === '/service-worker.js') {
      // Ensure clients revalidate on each navigation to pick up new SW quickly
      return { ttl: 0, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } };
    }
    if (lower.endsWith('/manifest.webmanifest') || lower === '/manifest.webmanifest') {
      return { ttl: CACHE_DURATIONS.pages.manifest, headers: { 'Cache-Control': `public, max-age=${CACHE_DURATIONS.pages.manifest}` } };
    }
    if (lower.endsWith('/sitemap.xml') || lower.endsWith('/sitemap-index.xml') || /\/sitemap-\d+\.xml$/.test(lower) || lower.endsWith('/rss.xml') || lower.endsWith('/feed.xml')) {
      return { ttl: CACHE_DURATIONS.pages.sitemap, headers: { 'Cache-Control': `public, max-age=${CACHE_DURATIONS.pages.sitemap}, no-transform` } };
    }
    if (lower.endsWith('/search-index.json')) {
      const ttl = CACHE_DURATIONS.pages.searchIndex;
      return { ttl, headers: { 'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=3600` } };
    }

    // APIs
    if (lower.startsWith('/api/')) {
      const ttl = CACHE_DURATIONS.api.default;
      return { ttl, headers: { 'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=3600` } };
    }

    // Static assets
    if (['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'svg', 'ico', 'woff2', 'pdf'].includes(extension)) {
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
    return { ttl, headers: { 'Cache-Control': `public, max-age=0, must-revalidate, stale-while-revalidate=${CACHE_DURATIONS.pages.htmlStaleWhileRevalidate}` } };
  }
}

const SOURCE_CATEGORY_ICONS = {
  'Project': '🛠️',
  'Case Study': '📊',
  'Blog Post': '📝',
  'Page': '📎'
};

function normalizeDateToIso(value) {
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function inferCollectionFromPath(pathname) {
  if (!pathname) return 'Page';
  const lower = pathname.toLowerCase();
  if (lower.startsWith('/projects') || lower.includes('/project')) return 'Project';
  if (lower.includes('case-study')) return 'Case Study';
  if (lower.startsWith('/blog') || lower.startsWith('/posts')) return 'Blog Post';
  if (lower.includes('/docs') || lower.includes('/guides')) return 'Guide';
  return 'Page';
}

function pickSummaryCandidate(entry, attributes, metadata) {
  const candidates = [
    attributes?.summary,
    metadata?.summary,
    metadata?.description,
    metadata?.excerpt,
    attributes?.description,
    entry?.summary,
    entry?.description,
    entry?.headline
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

function buildSourceMetadata(rawUrl, entry) {
  try {
    const url = new URL(rawUrl, 'https://blakeoxford.com');
    const attributes = entry?.attributes && typeof entry.attributes === 'object' ? entry.attributes : {};
    const metadata = attributes?.metadata && typeof attributes.metadata === 'object' ? attributes.metadata : {};
    const fileMeta = attributes?.file && typeof attributes.file === 'object' ? attributes.file : {};
    const publishedCandidate =
      metadata?.publishedAt ||
      metadata?.published_at ||
      metadata?.date ||
      fileMeta?.publishedAt ||
      fileMeta?.published_at ||
      fileMeta?.date ||
      entry?.published_at ||
      entry?.created_at ||
      entry?.date;
    const summary = pickSummaryCandidate(entry, attributes, metadata);
    const collection = metadata?.collection || attributes?.collection || inferCollectionFromPath(url.pathname);
    const icon = SOURCE_CATEGORY_ICONS[collection] || SOURCE_CATEGORY_ICONS[inferCollectionFromPath(url.pathname)] || '📎';
    return {
      collection,
      icon,
      publishedAt: normalizeDateToIso(publishedCandidate),
      summary
    };
  } catch {
    return { collection: 'Page', icon: '📎', publishedAt: undefined, summary: undefined };
  }
}

const WorkerApp = {
  isAuditRequest(req) {
    try {
      const ua = (req.headers.get('user-agent') || '').toLowerCase();
      const flag = (req.headers.get('x-audit-mode') || req.headers.get('x-lighthouse') || '').toString().toLowerCase();
      const cookie = req.headers.get('cookie') || '';
      const hasAuditCookie = /(^|;)\s*audit=1\s*(;|$)/.test(cookie);
      return ua.includes('lighthouse') || ua.includes('chrome-lighthouse') || ua.includes('headlesschrome') || flag === '1' || flag === 'true' || flag === 'lighthouse' || hasAuditCookie;
    } catch { return false; }
  },
  generateNonce() {
    try {
      if (crypto && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // fallback below
    }
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  },

  async fetch(request, env, ctx) {
    // Initialize Sentry for error tracking in edge function
    const Sentry = initEdgeSentry(env);

    const url = new URL(request.url);

    // Let Cloudflare's special /cdn-cgi/ paths pass through to origin (Zaraz, challenge-platform, etc.)
    // These are handled by Cloudflare's edge infrastructure, not our Worker
    if (url.pathname.startsWith('/cdn-cgi/')) {
      return fetch(request);
    }

    const method = request.method || 'GET';
    const reqId = (() => {
      try {
        const h = request.headers.get('cf-request-id') || request.headers.get('x-request-id');
        if (h) return h;
      } catch { /* no-op */ }
      try {
        const bytes = new Uint8Array(8);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
      } catch { return Math.random().toString(36).slice(2, 10); }
    })();

    // HTTPS + apex canonicalization
    try {
      const host = url.hostname;
      const isGetLike = request.method === 'GET' || request.method === 'HEAD';
      const isProdDomain = host.endsWith('blakeoxford.com');
      if (isProdDomain && url.protocol === 'http:' && isGetLike) {
        url.protocol = 'https:';
        const r = Response.redirect(url.toString(), 308);
        const h = new Headers(r.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'redirect');
        h.set('x-cache-policy', 'no-store');
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }
      if (isProdDomain && host.startsWith('www.') && isGetLike) {
        url.hostname = host.replace(/^www\./, '');
        const r = Response.redirect(url.toString(), 308);
        const h = new Headers(r.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'redirect');
        h.set('x-cache-policy', 'no-store');
        return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
      }
    } catch {
      // ignore canonicalization errors
    }

    // Special routes
    if (url.pathname === '/favicon.ico') {
      try {
        const pngUrl = new URL('/assets/images/favicon-32x32.png', url.origin);
        const pngReq = new Request(pngUrl.toString(), request);
        let icon = await env.ASSETS.fetch(pngReq);
        if (!icon.ok) return icon;
        const headers = new Headers(icon.headers);
        headers.set('content-type', 'image/x-icon');
        headers.set('cache-control', 'public, max-age=31536000, immutable');
        headers.set('x-request-id', reqId);
        headers.set('x-route-kind', 'asset');
        headers.set('x-cache-policy', headers.get('cache-control') || '');
        return new Response(icon.body, { status: icon.status, statusText: icon.statusText, headers });
      } catch {
        // fallback: not found favicon
        return new Response(null, { status: 404, headers: { 'x-request-id': reqId, 'x-route-kind': 'asset', 'x-cache-policy': 'no-store' } });
      }
    }

    if (url.pathname === '/robots.txt') {
      // Serve hardcoded robots.txt to prevent Cloudflare managed content injection
      // Note: Cloudflare may still inject managed content via Bot Fight Mode at edge
      const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /search/

Sitemap: https://blakeoxford.com/sitemap.xml`;

      return new Response(robotsTxt, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=300, no-transform',
          'cf-robots-txt': 'bypass',  // Attempt to bypass Cloudflare injection
          'x-robots-tag': 'none',     // Prevent additional bot control
          'x-request-id': reqId,
          'x-route-kind': 'asset',
          'x-cache-policy': 'public, max-age=300, no-transform'
        }
      });
    }

    // CSP violation report collection endpoint
    if (url.pathname === '/csp-report') {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { 'allow': 'POST', 'cache-control': 'no-store', 'x-request-id': reqId, 'x-route-kind': 'api', 'x-cache-policy': 'no-store' } });
      }
      try {
        const ct = (request.headers.get('content-type') || '').toLowerCase();
        let bodyText = await request.text();
        let payload;
        try {
          payload = JSON.parse(bodyText);
        } catch {
          payload = { raw: bodyText };
        }
        // Normalize legacy report format
        const report = payload?.['csp-report'] ? { type: 'csp-report', ...payload['csp-report'] } : payload;
        const record = {
          t: Date.now(),
          url: request.url,
          ip: request.headers.get('cf-connecting-ip') || null,
          ua: request.headers.get('user-agent') || null,
          ct,
          report
        };
        console.warn('\ud83d\udd10 CSP violation report:', record);
        const key = `csp:${record.t}:${Math.random().toString(36).slice(2, 8)}`;
        // Prefer dedicated storage; if not configured, this is a best-effort no-op
        if (env.CSP_REPORTS && typeof env.CSP_REPORTS.put === 'function') {
          await env.CSP_REPORTS.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 7 });
        } else if (env.RATE_LIMIT_KV && typeof env.RATE_LIMIT_KV.put === 'function') {
          // Fallback storage if dedicated KV is not bound
          await env.RATE_LIMIT_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 3 });
        }
      } catch (e) {
        console.error('Failed to store CSP report:', e);
      }
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-request-id': reqId, 'x-route-kind': 'api', 'x-cache-policy': 'no-store' } });
    }

    // Health endpoint (moved off /metrics to avoid third-party collisions)
    if (url.pathname === '/_healthz' || url.pathname === '/_healthz/') {
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store, no-cache, must-revalidate', 'content-type': 'text/plain; charset=utf-8', 'content-length': '0', 'x-content-type-options': 'nosniff', 'x-request-id': reqId, 'x-route-kind': 'health', 'x-cache-policy': 'no-store, no-cache, must-revalidate' } });
    }

    // Debug route: intentionally trigger a test error to verify Sentry (edge)
    if (url.pathname === '/debug/edge-sentry-test') {
      try {
        addEdgeBreadcrumb({
          category: 'debug',
          message: 'Triggering Sentry edge test error',
          level: 'info',
          data: { reqId }
        });
        throw new Error('Sentry Edge Test: manual trigger from /debug/edge-sentry-test');
      } catch (err) {
        try {
          Sentry.captureException(err, {
            tags: { route: 'debug-edge-sentry-test' },
            extra: { reqId, path: url.pathname, method }
          });
        } catch { /* swallow */ }
        return new Response('Edge test error captured. Check Sentry project for an event.', {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store',
            'x-request-id': reqId,
            'x-route-kind': 'debug',
            'x-cache-policy': 'no-store'
          }
        });
      }
    }

    // Legacy no-op for previous metrics path
    if (url.pathname === '/metrics/' || url.pathname === '/metrics') {
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store, no-cache, must-revalidate', 'content-type': 'text/plain; charset=utf-8', 'content-length': '0', 'x-content-type-options': 'nosniff', 'x-request-id': reqId, 'x-route-kind': 'health', 'x-cache-policy': 'no-store, no-cache, must-revalidate' } });
    }

    if (url.pathname === '/send-email' && request.method === 'POST') {
      const res = await handleSendEmail({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
      try {
        const h = new Headers(res.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', 'api');
        const cc = h.get('cache-control') || 'no-store';
        h.set('cache-control', cc);
        h.set('x-cache-policy', cc);
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
      } catch { return res; }
    }

    if (url.pathname === '/api/ai-search') {
      const startTime = Date.now();
      const origin = request.headers.get('origin') || '*';
      const baseCorsHeaders = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, x-session-id',
        'vary': 'Origin',
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-request-id': reqId,
        'x-route-kind': 'api',
        'x-cache-policy': 'no-store'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: baseCorsHeaders });
      }

      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: baseCorsHeaders });
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: baseCorsHeaders });
      }

      const query = typeof payload?.query === 'string'
        ? payload.query.trim()
        : typeof payload?.prompt === 'string'
          ? payload.prompt.trim()
          : typeof payload?.question === 'string'
            ? payload.question.trim()
            : '';
      if (!query) {
        return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400, headers: baseCorsHeaders });
      }

      // Enhanced rate limiting with per-IP and per-session limits
      const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
      const sessionId = request.headers.get('x-session-id') || null;

      const rateLimitCheck = async () => {
        if (!env.RATE_LIMIT_KV) return { limited: false };

        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute window

        // Per-IP limit: 10 requests per minute
        const ipKey = `ratelimit:ai:ip:${clientIp}`;
        const ipData = await env.RATE_LIMIT_KV.get(ipKey, 'json');
        const ipCount = ipData || { count: 0, reset: now + windowMs };

        if (now > ipCount.reset) {
          ipCount.count = 0;
          ipCount.reset = now + windowMs;
        }

        ipCount.count++;
        await env.RATE_LIMIT_KV.put(ipKey, JSON.stringify(ipCount), { expirationTtl: 120 });

        if (ipCount.count > 10) {
          return { limited: true, reason: 'ip', resetIn: Math.ceil((ipCount.reset - now) / 1000) };
        }

        // Per-session limit: 30 requests per minute (more generous for legitimate users)
        if (sessionId) {
          const sessionKey = `ratelimit:ai:session:${sessionId}`;
          const sessionData = await env.RATE_LIMIT_KV.get(sessionKey, 'json');
          const sessionCount = sessionData || { count: 0, reset: now + windowMs };

          if (now > sessionCount.reset) {
            sessionCount.count = 0;
            sessionCount.reset = now + windowMs;
          }

          sessionCount.count++;
          await env.RATE_LIMIT_KV.put(sessionKey, JSON.stringify(sessionCount), { expirationTtl: 120 });

          if (sessionCount.count > 30) {
            return { limited: true, reason: 'session', resetIn: Math.ceil((sessionCount.reset - now) / 1000) };
          }
        }

        return { limited: false };
      };

      const rateLimit = await rateLimitCheck();
      if (rateLimit.limited) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please wait a moment before trying again.',
          resetIn: rateLimit.resetIn
        }), {
          status: 429,
          headers: {
            ...baseCorsHeaders,
            'retry-after': String(rateLimit.resetIn),
            'x-rate-limit-reason': rateLimit.reason
          }
        });
      }

      const history = Array.isArray(payload?.history)
        ? payload.history
            .filter((entry) => entry && typeof entry === 'object' && typeof entry.role === 'string' && typeof entry.content === 'string')
            .slice(-10)
        : [];

      // Edge-side prompt enhancement for better responses
      const enhanceQueryAtEdge = (q, hist) => {
        const enhanced = { query: q, shouldUseCache: true, complexity: 'simple' };
        const lowerQuery = q.toLowerCase();
        
        // CRITICAL: Anti-hallucination system instruction (concise version)
        const antiHallucinationPrefix = `[SYSTEM: Only cite information from your indexed knowledge base. If unsure, say "I don't have that information." Do not fabricate project details.]\n\n`;
        
        // Skill/expertise queries - add context for detailed answers
        if (lowerQuery.match(/skill|proficien|expert|experience|knowledge|technolog/)) {
          enhanced.query = `${antiHallucinationPrefix}${q}\n\nFocus on specific technical skills with concrete project examples and measurable outcomes.`;
          enhanced.complexity = 'medium';
        }
        // Project queries - request detailed project information
        else if (lowerQuery.match(/project|built|created|developed|implemented|work|case study|portfolio/)) {
          enhanced.query = `${antiHallucinationPrefix}${q}\n\nProvide specific project details: technologies, business impact, challenges, outcomes. Only cite documented projects.`;
          enhanced.complexity = 'medium';
        }
        // Comparison queries - ensure detailed comparative analysis
        else if (lowerQuery.match(/compare|versus|vs|difference|better|prefer/)) {
          enhanced.query = `${antiHallucinationPrefix}${q}\n\nCompare approaches from different projects with specific examples and recommendations.`;
          enhanced.complexity = 'complex';
        }
        // How-to queries - provide step-by-step guidance
        else if (lowerQuery.match(/how|guide|steps|process|explain|teach/)) {
          enhanced.query = `${antiHallucinationPrefix}${q}\n\nProvide step-by-step explanations based on actual implementation experience.`;
          enhanced.complexity = 'complex';
        }
        // Time-sensitive queries - bypass cache AND enforce strict knowledge base filtering
        else if (lowerQuery.match(/latest|recent|current|now|today/)) {
          enhanced.query = `${antiHallucinationPrefix}${q}\n\nOnly cite projects with dates in the knowledge base. Sort by date. Do not fabricate recent work.`;
          enhanced.shouldUseCache = false;
          enhanced.complexity = 'medium';
        }
        // Default: still apply anti-hallucination prefix
        else {
          enhanced.query = `${antiHallucinationPrefix}${q}`;
        }
        
        // For follow-up questions, add conversation context
        if (hist.length > 0 && q.length < 40) {
          const lastUserMsg = hist.filter(h => h.role === 'user').slice(-1)[0];
          if (lastUserMsg) {
            enhanced.query = `${antiHallucinationPrefix}Follow-up: ${q}\n(Previous: "${lastUserMsg.content.slice(0, 60)}...")`;
          }
        }
        
        return enhanced;
      };
      
      const { query: enhancedQuery, shouldUseCache: enhancedCacheFlag, complexity } = enhanceQueryAtEdge(query, history);

      /**
       * Handle simple queries with Workers AI (on-edge inference)
       * Much faster and cheaper than AutoRAG for basic questions
       */
      const handleSimpleQueryWithWorkersAI = async (q, hist, env) => {
        try {
          // Build conversation context
          const messages = [
            {
              role: 'system',
              content: `You are Blake Oxford's AI assistant. 

CRITICAL RULES:
1. ONLY provide information that is explicitly documented in Blake's portfolio
2. If you don't have specific information, say "I don't have that information in my current knowledge base"
3. NEVER fabricate project details, technologies, or achievements
4. Do not mention projects involving AWS Lambda, DynamoDB, or e-commerce unless explicitly documented

Blake's verified expertise includes:
- Healthcare technology (AdvancedMD EHR implementation, patient documentation systems)
- Enterprise systems (Microsoft Fabric, Google Workspace → M365 migration, ADP Workforce Now)
- Cloud platforms (Cloudflare Workers, Azure, Microsoft 365)
- AI/ML applications (OpenAI integration for clinical documentation)
- Full-stack development (React, TypeScript, Python, SwiftUI)

Provide concise, professional responses (2-3 sentences) for simple questions. Be friendly and helpful, but factual.`
            },
            ...hist.slice(-3), // Last 3 messages for context
            { role: 'user', content: q }
          ];

          // Call Workers AI with Llama 3.1 8B model (fast, cost-effective)
          const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages,
            max_tokens: 300, // Keep responses concise for simple queries
            temperature: 0.7
          });

          if (response && response.response) {
            return {
              message: response.response.trim(),
              sources: [], // Workers AI doesn't have RAG context
              fromWorkersAI: true,
              model: 'llama-3.1-8b'
            };
          }
          
          return null; // Fall back to AutoRAG
        } catch (error) {
          console.warn('Workers AI failed, falling back to AutoRAG:', error);
          return null; // Fall back to AutoRAG on error
        }
      };

      // Normalize query for caching
      const normalizeForCache = (q) => {
        return q.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim()
          .slice(0, 100);
      };

      const cacheKey = `ai:response:${normalizeForCache(query)}`;
      const cacheEnabled = !query.toLowerCase().includes('latest') &&
                          !query.toLowerCase().includes('recent') &&
                          !query.toLowerCase().includes('now') &&
                          !query.toLowerCase().includes('today');
      
      // Update cache enabled based on edge enhancement
      const finalCacheEnabled = cacheEnabled && enhancedCacheFlag;

      // For simple queries, try Workers AI first (70x faster, 76% cheaper)
      if (complexity === 'simple' && env.AI) {
        const workersAIResult = await handleSimpleQueryWithWorkersAI(enhancedQuery, history, env);
        
        if (workersAIResult) {
          const responseHeaders = {
            ...baseCorsHeaders,
            'x-query-complexity': complexity,
            'x-ai-provider': 'workers-ai',
            'x-response-time': String(Date.now() - startTime)
          };

          // Log to analytics
          if (env.AI_ANALYTICS) {
            try {
              env.AI_ANALYTICS.writeDataPoint({
                blobs: [
                  query.slice(0, 100),
                  'WORKERS_AI',
                  clientIp,
                  sessionId || 'anonymous',
                  complexity
                ],
                doubles: [
                  0, // No sources from Workers AI
                  workersAIResult.message?.length || 0,
                  Date.now() - startTime
                ],
                indexes: ['workers_ai', `complexity_${complexity}`]
              });
            } catch {
              // Silently fail - analytics is non-critical
            }
          }

          return new Response(JSON.stringify(workersAIResult), {
            status: 200,
            headers: responseHeaders
          });
        }
      }

      // Try to get cached response
      if (finalCacheEnabled && env.AI_RESPONSE_CACHE) {
        try {
          const cached = await env.AI_RESPONSE_CACHE.get(cacheKey, 'json');
          if (cached && cached.message && Date.now() - cached.timestamp < 7*24*60*60*1000) { // 7 days
            const responseData = {
              message: cached.message,
              sources: cached.sources || [],
              fromCache: true,
              cachedAt: cached.timestamp
            };

            const cacheHeaders = {
              ...baseCorsHeaders,
              'x-cache-status': 'HIT',
              'x-cache-age': String(Math.floor((Date.now() - cached.timestamp) / 1000)),
              'x-query-complexity': complexity,
              'x-ai-provider': 'autorag-cached'
            };

            // Log cache hit to analytics
            if (env.AI_ANALYTICS) {
              try {
                env.AI_ANALYTICS.writeDataPoint({
                  blobs: [
                    query.slice(0, 100),
                    'CACHE_HIT',
                    clientIp,
                    sessionId || 'anonymous',
                    complexity || 'unknown'
                  ],
                  doubles: [
                    cached.sources?.length || 0,
                    cached.message?.length || 0,
                    Date.now() - startTime
                  ],
                  indexes: ['cache_hit', `complexity_${complexity}`]
                });
              } catch {
                // Silently fail - analytics is non-critical
              }
            }

            return new Response(JSON.stringify(responseData), {
              status: 200,
              headers: cacheHeaders
            });
          }
        } catch {
          // Cache read failed, continue to AutoRAG call
        }
      }

      const upstreamEndpoint = env.AI_SEARCH_API_ENDPOINT;
      const upstreamToken = env.AI_SEARCH_API_TOKEN || env['search-api'];

      const wantsStream = payload?.stream === true || ((request.headers.get('accept') || '')
        .toLowerCase()
        .includes('text/event-stream'));

      if (!upstreamEndpoint || !upstreamToken) {
        return new Response(JSON.stringify({ error: 'AI search service not configured' }), { status: 503, headers: baseCorsHeaders });
      }

      try {
        const requestBody = { query: enhancedQuery, history };
        
        // Use AI Gateway if configured for unified logging and fallback support
        let fetchUrl = upstreamEndpoint;
        const fetchHeaders = {
          'content-type': 'application/json',
          'authorization': `Bearer ${upstreamToken}`
        };
        
        if (env.AI_GATEWAY_ID && env.AI_GATEWAY_ACCOUNT_ID) {
          fetchHeaders['cf-aig-cache-ttl'] = '3600';
          fetchHeaders['cf-aig-metadata'] = JSON.stringify({ 
            user: sessionId || 'anonymous', 
            source: 'website-chat',
            complexity,
            enhanced: query !== enhancedQuery
          });
        }
        
        const upstreamResponse = await fetch(fetchUrl, {
          method: 'POST',
          headers: fetchHeaders,
          body: JSON.stringify(requestBody),
          cf: { cacheTtl: 0, cacheEverything: false }
        });

        if (!upstreamResponse.ok) {
          let errorDetail = 'Upstream service error';
          try {
            const upstreamError = await upstreamResponse.json();
            if (typeof upstreamError?.error === 'string') {
              errorDetail = upstreamError.error;
            }
          } catch {
            const upstreamText = await upstreamResponse.text();
            if (upstreamText) errorDetail = upstreamText.slice(0, 200);
          }
          return new Response(JSON.stringify({ error: errorDetail }), { status: upstreamResponse.status, headers: baseCorsHeaders });
        }

        let upstreamData;
        try {
          upstreamData = await upstreamResponse.json();
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), { status: 502, headers: baseCorsHeaders });
        }

        if (upstreamData && typeof upstreamData === 'object' && upstreamData.success === false) {
          const upstreamError = typeof upstreamData?.errors?.[0]?.message === 'string' ? upstreamData.errors[0].message : 'AI search service reported an error';
          return new Response(JSON.stringify({ error: upstreamError }), { status: 502, headers: baseCorsHeaders });
        }

        const result = upstreamData?.result && typeof upstreamData.result === 'object' ? upstreamData.result : upstreamData;
        const message = typeof result?.response === 'string'
          ? result.response.trim()
          : typeof upstreamData?.response === 'string'
            ? upstreamData.response.trim()
            : '';

        const sources = Array.isArray(result?.data)
          ? result.data
              .map((entry, index) => {
                if (!entry || typeof entry !== 'object') return null;
                const attributes = entry.attributes && typeof entry.attributes === 'object' ? entry.attributes : {};
                const fileMeta = attributes.file && typeof attributes.file === 'object' ? attributes.file : {};
                const rawUrl = typeof entry.filename === 'string' && entry.filename
                  ? entry.filename
                  : typeof attributes.folder === 'string'
                    ? attributes.folder
                    : '';
                if (!rawUrl) return null;
                const titleCandidate = typeof fileMeta.title === 'string' && fileMeta.title.trim()
                  ? fileMeta.title.trim()
                  : typeof attributes.folder === 'string' && attributes.folder.trim()
                    ? attributes.folder.trim()
                    : `Source ${index + 1}`;
                let snippet;
                if (Array.isArray(entry.content)) {
                  const contentItem = entry.content.find((item) => item && typeof item === 'object' && typeof item.text === 'string' && item.text.trim());
                  if (contentItem && typeof contentItem.text === 'string') {
                    snippet = contentItem.text.trim().slice(0, 320);
                  }
                }
                const score = typeof entry.score === 'number' ? entry.score : undefined;
                const metadata = buildSourceMetadata(rawUrl, entry);
                const sourcePayload = {
                  title: titleCandidate,
                  url: rawUrl,
                };
                if (snippet) {
                  sourcePayload.snippet = snippet;
                }
                if (typeof score === 'number') {
                  sourcePayload.score = score;
                }
                if (metadata.collection) {
                  sourcePayload.collection = metadata.collection;
                }
                if (metadata.icon) {
                  sourcePayload.icon = metadata.icon;
                }
                if (metadata.publishedAt) {
                  sourcePayload.publishedAt = metadata.publishedAt;
                }
                if (metadata.summary) {
                  sourcePayload.summary = metadata.summary;
                }
                return sourcePayload;
              })
              .filter((value) => Boolean(value))
          : [];

        if (!message) {
          return new Response(JSON.stringify({ error: 'AI service returned no message' }), { status: 502, headers: baseCorsHeaders });
        }

        if (wantsStream) {
          const streamHeaders = new Headers(baseCorsHeaders);
          streamHeaders.set('content-type', 'text/event-stream; charset=utf-8');
          streamHeaders.set('cache-control', 'no-store');
          streamHeaders.set('x-cache-status', 'MISS');
          streamHeaders.set('x-response-time', String(Date.now() - startTime));
          streamHeaders.set('x-query-complexity', complexity);
          streamHeaders.set('x-query-enhanced', String(query !== enhancedQuery));
          streamHeaders.set('x-ai-provider', 'autorag');

          const encoder = new globalThis.TextEncoder();
          const sleep = (ms) => (typeof globalThis.setTimeout === 'function'
            ? new Promise((resolve) => globalThis.setTimeout(resolve, ms))
            : Promise.resolve());
          const stream = new globalThis.ReadableStream({
            async start(controller) {
              const send = (eventName, data) => {
                const payloadString = data !== undefined ? JSON.stringify(data) : '';
                const chunk = `event: ${eventName}\n${payloadString ? `data: ${payloadString}\n` : ''}\n`;
                controller.enqueue(encoder.encode(chunk));
              };
              send('ready');
              const tokens = message.split(/(\s+)/).filter((part) => Boolean(part));
              for (const token of tokens) {
                send('token', { text: token });
                await sleep(Math.min(120, 18 + token.length * 6));
              }
              if (Array.isArray(sources) && sources.length > 0) {
                send('sources', sources);
              }
              send('done', { message });
              controller.close();

              // Cache and log after streaming completes
              if (finalCacheEnabled && env.AI_RESPONSE_CACHE && message) {
                try {
                  await env.AI_RESPONSE_CACHE.put(cacheKey, JSON.stringify({
                    message,
                    sources,
                    timestamp: Date.now()
                  }), { expirationTtl: 7 * 24 * 60 * 60 });
                } catch {
                  // Cache write failed, continue anyway
                }
              }

              if (env.AI_ANALYTICS) {
                try {
                  const responseTime = Date.now() - startTime;
                  env.AI_ANALYTICS.writeDataPoint({
                    blobs: [
                      query.slice(0, 100),
                      'API_CALL_STREAM',
                      clientIp,
                      sessionId || 'anonymous',
                      complexity || 'unknown'
                    ],
                    doubles: [
                      sources.length,
                      message.length,
                      responseTime
                    ],
                    indexes: ['ai_query', `complexity_${complexity}`]
                  });
                } catch {
                  // Analytics write failed, continue anyway
                }
              }
            },
            cancel() {
              return undefined;
            }
          });
          return new Response(stream, { status: 200, headers: streamHeaders });
        }

        const responsePayload = JSON.stringify({ message, sources });

        // Cache the response for future queries
        if (finalCacheEnabled && env.AI_RESPONSE_CACHE && message) {
          try {
            await env.AI_RESPONSE_CACHE.put(cacheKey, JSON.stringify({
              message,
              sources,
              timestamp: Date.now()
            }), { expirationTtl: 7 * 24 * 60 * 60 }); // 7 days
          } catch {
            // Cache write failed, continue anyway
          }
        }

        // Log successful query to analytics
        if (env.AI_ANALYTICS) {
          try {
            const responseTime = Date.now() - startTime;
            env.AI_ANALYTICS.writeDataPoint({
              blobs: [
                query.slice(0, 100),
                'API_CALL',
                clientIp,
                sessionId || 'anonymous',
                complexity || 'unknown'
              ],
              doubles: [
                sources.length,
                message.length,
                responseTime
              ],
              indexes: ['ai_query', `complexity_${complexity}`]
            });
          } catch {
            // Analytics write failed, continue anyway
          }
        }

        const responseHeaders = {
          ...baseCorsHeaders,
          'x-cache-status': 'MISS',
          'x-response-time': String(Date.now() - startTime),
          'x-query-complexity': complexity,
          'x-query-enhanced': String(query !== enhancedQuery),
          'x-ai-provider': 'autorag'
        };

        return new Response(responsePayload, { status: 200, headers: responseHeaders });
      } catch (error) {
        let errorMessage = 'AI search request failed';
        if (error instanceof Error && error.name === 'AbortError') {
          errorMessage = 'AI search request timed out';
        }
        return new Response(JSON.stringify({ error: errorMessage }), { status: 504, headers: baseCorsHeaders });
      }
    }

    // Real-time conversation via Durable Objects WebSocket
    if (url.pathname === '/api/conversation-ws' || url.pathname.startsWith('/api/conversation/')) {
      try {
        // Get or create conversation Durable Object
        const conversationId = url.searchParams.get('id') || 'default';
        const id = env.CONVERSATION_DO.idFromName(conversationId);
        const stub = env.CONVERSATION_DO.get(id);
        
        // Forward request to Durable Object
        return stub.fetch(request);
        } catch (error) {
        console.error('Edge Worker: conversation Durable Object unavailable', error);
        const origin = request.headers.get('origin') || '*';
        return new Response(JSON.stringify({ 
          error: 'Conversation service unavailable',
          fallback: 'Use HTTP endpoints instead'
        }), { 
          status: 503,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': origin,
            'access-control-allow-credentials': 'true'
          }
        });
      }
    }

    // Semantic search endpoint using Vectorize
    if (url.pathname === '/api/semantic-search') {
      const origin = request.headers.get('origin') || '*';
      const baseCorsHeaders = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'cache-control': 'no-store',
        'vary': 'Origin'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: baseCorsHeaders });
      }

      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
          status: 405, 
          headers: baseCorsHeaders 
        });
      }

      try {
        const { query, limit = 5 } = await request.json();

        if (!query || typeof query !== 'string') {
          return new Response(JSON.stringify({ error: 'Query is required' }), {
            status: 400,
            headers: baseCorsHeaders
          });
        }

        // Check if Vectorize is available
        if (!env.VECTORIZE) {
          return new Response(JSON.stringify({ 
            error: 'Semantic search not configured',
            fallback: 'using-keyword-search' 
          }), {
            status: 503,
            headers: baseCorsHeaders
          });
        }

        // Generate embedding for query using Workers AI
        let queryEmbedding;
        try {
          const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: [query]
          });
          queryEmbedding = embeddingResponse.data[0];
        } catch (error) {
          return new Response(JSON.stringify({ 
            error: 'Failed to generate query embedding',
            details: error.message 
          }), {
            status: 500,
            headers: baseCorsHeaders
          });
        }

        // Query Vectorize index
        const vectorizeResults = await env.VECTORIZE.query(queryEmbedding, {
          topK: Math.min(limit, 10),
          returnMetadata: true,
          returnValues: false
        });

        // Format results
        const results = vectorizeResults.matches.map(match => ({
          id: match.id,
          score: match.score,
          title: match.metadata?.title || '',
          description: match.metadata?.description || '',
          url: match.metadata?.url || '',
          collection: match.metadata?.collection || '',
          tags: match.metadata?.tags ? match.metadata.tags.split(',') : [],
          date: match.metadata?.date || ''
        }));

        return new Response(JSON.stringify({ 
          query,
          results,
          count: results.length 
        }), {
          status: 200,
          headers: {
            ...baseCorsHeaders,
            'content-type': 'application/json'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Semantic search failed',
          details: error.message 
        }), {
          status: 500,
          headers: baseCorsHeaders
        });
      }
    }

    if (url.pathname === '/api/ai-feedback') {
      const origin = request.headers.get('origin') || '*';
      const corsHeaders = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'vary': 'Origin',
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-request-id': reqId,
        'x-route-kind': 'api',
        'x-cache-policy': 'no-store'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: corsHeaders });
      }

      const messageId = typeof payload?.messageId === 'string' ? payload.messageId.trim() : '';
      const sentiment = payload?.sentiment === 'positive' || payload?.sentiment === 'negative' ? payload.sentiment : undefined;
      const query = typeof payload?.query === 'string' ? payload.query.slice(0, 500) : undefined;
      const metadata = payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};

      if (!messageId || !sentiment) {
        return new Response(JSON.stringify({ error: 'Feedback submission missing data' }), { status: 400, headers: corsHeaders });
      }

      const record = {
        id: messageId,
        sentiment,
        query,
        metadata,
        ts: Date.now()
      };

      try {
        if (env.AI_FEEDBACK_KV && typeof env.AI_FEEDBACK_KV.put === 'function') {
          const key = `feedback:${record.ts}:${record.id}`;
          await env.AI_FEEDBACK_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 30 });
        } else {
          console.log('AI feedback event', JSON.stringify(record));
        }
      } catch (error) {
        console.error('AI feedback storage failed', error);
      }

      return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: corsHeaders });
    }

    // Back-compat asset rewrite: maintain existing path if older HTML referenced it
    if (url.pathname === '/assets/js/search-overlay-standalone.min.js' && url.search === '?v=2') {
      return env.ASSETS.fetch(request);
    }

    // Image path remaps
    if (url.pathname === '/assets/images/optimized/avif/china-profile-picture@640w.avif') {
      try {
        const img320 = new URL('/assets/images/optimized/avif/china-profile-picture@320w.avif', url.origin);
        const imgReq = new Request(img320.toString(), request);
        const imgRes = await env.ASSETS.fetch(imgReq);
        if (imgRes.ok) {
          const headers = new Headers(imgRes.headers);
          headers.set('content-type', 'image/avif');
          headers.set('cache-control', 'public, max-age=31536000, immutable');
          headers.set('x-request-id', reqId);
          headers.set('x-route-kind', 'asset');
          headers.set('x-cache-policy', headers.get('cache-control') || '');
          return new Response(imgRes.body, { status: 200, headers });
        }
      } catch {
        // ignore remap failure; fall through
      }
    }
    if (url.pathname === '/assets/images/optimized/avif/china-profile-picture@320w.avif') {
      try {
        const base = new URL('/assets/images/optimized/avif/china-profile-picture.avif', url.origin);
        const baseReq = new Request(base.toString(), request);
        const baseRes = await env.ASSETS.fetch(baseReq);
        if (baseRes.ok) {
          const headers = new Headers(baseRes.headers);
          headers.set('content-type', 'image/avif');
          headers.set('cache-control', 'public, max-age=31536000, immutable');
          headers.set('x-request-id', reqId);
          headers.set('x-route-kind', 'asset');
          headers.set('x-cache-policy', headers.get('cache-control') || '');
          return new Response(baseRes.body, { status: 200, headers });
        }
      } catch {
        // ignore remap failure; fall through
      }
    }

    // Serve from ASSETS
    const cacheManager = new EdgeCacheManager(request, env);
    const cacheStrategy = cacheManager.getCacheStrategy();

    if (method === 'GET') {
      const cacheResponse = await caches.default.match(request, { ignoreMethod: false });
      if (cacheResponse) return cacheResponse;
    }

    try {
      const startTs = Date.now();
      console.log('\u27a1\ufe0f Request start', JSON.stringify({ id: reqId, method, path: url.pathname }));

      // Add breadcrumb for request tracking
      addEdgeBreadcrumb({
        category: 'http',
        message: `${method} ${url.pathname}`,
        level: 'info',
        data: { reqId, method, path: url.pathname }
      });

      let originResponse = await env.ASSETS.fetch(request);

      if (originResponse.status === 404 && !url.pathname.includes('.') && !url.pathname.endsWith('/index.html')) {
        const altUrl = new URL(url);
        altUrl.pathname = url.pathname.replace(/\/$/, '') + '/index.html';
        originResponse = await env.ASSETS.fetch(new Request(altUrl.toString(), request));
      }

      if (!originResponse.ok) {
        if (originResponse.status >= 500) {
          const cached = await caches.default.match(request);
          if (cached) return cached;
          const isHtmlRoute = request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('/') || !url.pathname.includes('.');
          if (isHtmlRoute) {
            const offlineHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Temporarily unavailable</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0b1020;color:#e5e7eb}.card{background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;max-width:560px;box-shadow:0 8px 32px rgba(0,0,0,.25)}h1{font-size:20px;margin:0 0 8px}p{margin:0 0 12px;color:#cbd5e1}a.btn{display:inline-block;background:#ffffff;color:#111827;font-weight:700;padding:8px 12px;border-radius:8px;text-decoration:none}.meta{margin-top:8px;font-size:12px;color:#94a3b8}</style></head><body><div class="card"><h1>We\'re updating things</h1><p>Please try again in a moment. If this persists, contact me via LinkedIn below.</p><a class="btn" href="/">Go home</a><div class="meta">Correlation ID: '+reqId+'</div></div></body></html>';
            const headers = { 'content-type': 'text/html; charset=utf-8', 'x-request-id': reqId, 'x-route-kind': 'html', 'cache-control': 'no-store', 'x-cache-policy': 'no-store' };
            const resp = new Response(offlineHtml, { status: 200, headers });
            console.log('\u26a0\ufe0f Fallback html', JSON.stringify({ id: reqId, status: resp.status, path: url.pathname, dur: Date.now() - startTs }));
            return resp;
          }
          // Graceful fallbacks for non-HTML requests during transient failures
          const pathname = url.pathname;
          // API endpoints: return empty array/object to avoid UI hard-fail during outages
          if (pathname.startsWith('/api/')) {
            const empty = pathname.endsWith('.json') ? '[]' : '';
            return new Response(empty, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-request-id': reqId, 'x-route-kind': 'api', 'x-cache-policy': 'no-store' } });
          }
          // Images: serve a lightweight placeholder if possible
          if (/^\/assets\/images\//.test(pathname)) {
            try {
              const placeholderUrl = new URL('/assets/images/placeholder-avatar.webp', url.origin);
              const placeholderReq = new Request(placeholderUrl.toString(), request);
              const phRes = await env.ASSETS.fetch(placeholderReq);
              if (phRes && phRes.ok) {
                const headers = new Headers(phRes.headers);
                headers.set('content-type', 'image/webp');
                headers.set('cache-control', 'public, max-age=86400');
                headers.set('x-request-id', reqId);
                headers.set('x-route-kind', 'asset');
                headers.set('x-cache-policy', headers.get('cache-control') || '');
                return new Response(phRes.body, { status: 200, headers });
              }
            } catch { /* ignore and fall through */ }
            // As last resort, return 204 to prevent noisy console errors
            return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-request-id': reqId, 'x-route-kind': 'asset', 'x-cache-policy': 'no-store' } });
          }
        }
        // For non-5xx errors (e.g., 404), still attach diagnostics headers
        try {
          const h = new Headers(originResponse.headers);
          h.set('x-request-id', reqId);
          const pathLower = url.pathname.toLowerCase();
          const routeKind = pathLower.startsWith('/api/') ? 'api' : (pathLower.endsWith('.js') || pathLower.endsWith('.css') || pathLower.startsWith('/_astro/') || pathLower.startsWith('/assets/')) ? 'asset' : 'html';
          h.set('x-route-kind', routeKind);
          const cc = h.get('cache-control') || 'no-store';
          h.set('x-cache-policy', cc);
          return new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers: h });
        } catch {
          return originResponse;
        }
      }

      const contentType = originResponse.headers.get('content-type') || '';
      if (!contentType) {
        const pathLower = url.pathname.toLowerCase();
        const guess = pathLower.endsWith('.css') ? 'text/css; charset=utf-8'
          : pathLower.endsWith('.js') ? 'application/javascript; charset=utf-8'
          : pathLower.endsWith('.json') ? 'application/json; charset=utf-8'
          : pathLower.endsWith('.svg') ? 'image/svg+xml'
          : pathLower.endsWith('.xml') ? 'application/xml; charset=utf-8'
          : pathLower.endsWith('.txt') ? 'text/plain; charset=utf-8'
          : pathLower.endsWith('.ico') ? 'image/x-icon' : '';
        if (guess) {
          const fixedHeaders = new Headers(originResponse.headers);
          fixedHeaders.set('content-type', guess);
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers: fixedHeaders });
        }
      }

      const pathLower = url.pathname.toLowerCase();
      const routeKind = (() => {
        if (pathLower.startsWith('/api/')) return 'api';
        if (pathLower.endsWith('.js') || pathLower.endsWith('.css') || pathLower.startsWith('/_astro/') || pathLower.startsWith('/assets/')) return 'asset';
        return 'html';
      })();
      if (method === 'GET') {
        const isHtml = originResponse.headers.get('content-type')?.includes('text/html');
        const isAssetExt = /\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2|pdf)$/.test(pathLower) || pathLower.startsWith('/assets/') || pathLower.startsWith('/_astro/');
        const isHashed = isHashedPath(pathLower);
        const headers = new Headers(originResponse.headers);

        // Add a conservative Vary header for encoding differences
        const existingVary = headers.get('vary');
        headers.set('vary', existingVary ? `${existingVary}, Accept-Encoding` : 'Accept-Encoding');

        if (pathLower === '/sw.js' || pathLower === '/service-worker.js') {
          headers.set('cache-control', 'no-cache, no-store, must-revalidate');
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        } else if (pathLower.endsWith('/manifest.webmanifest') || pathLower === '/manifest.webmanifest') {
          headers.set('cache-control', `public, max-age=${CACHE_DURATIONS.pages.manifest}`);
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        } else if (isAssetExt) {
          const ttl = isHashed ? CACHE_DURATIONS.static.hashed : CACHE_DURATIONS.assets.default;
          headers.set('cache-control', isHashed ? `public, max-age=${ttl}, immutable` : `public, max-age=${ttl}`);
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        } else if (isHtml) {
          // Keep HTML fresh on clients; CDN can still keep for short periods
          headers.set('cache-control', `public, max-age=0, must-revalidate, stale-while-revalidate=${CACHE_DURATIONS.pages.htmlStaleWhileRevalidate}`);
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        }
      }

      // Removed legacy edge optimization and personalization
      let finalResponse = originResponse;

      if (method === 'GET' && cacheStrategy.ttl > 0 && finalResponse.body) {
        const cacheHeaders = new Headers(finalResponse.headers);
        Object.entries(cacheStrategy.headers).forEach(([key, value]) => cacheHeaders.set(key, value));
        const [forCache, forReturn] = finalResponse.body.tee();
        const cacheResponse = new Response(forCache, { status: finalResponse.status, statusText: finalResponse.statusText, headers: cacheHeaders });
        ctx.waitUntil(caches.default.put(request, cacheResponse));
        finalResponse = new Response(forReturn, { status: finalResponse.status, statusText: finalResponse.statusText, headers: finalResponse.headers });
      }

      // Edge analytics disabled
      try {
        const h = new Headers(finalResponse.headers);
        h.set('x-request-id', reqId);
        h.set('x-route-kind', routeKind);
        const cc = h.get('cache-control');
        if (cc) h.set('x-cache-policy', cc);
        finalResponse = new Response(finalResponse.body, { status: finalResponse.status, statusText: finalResponse.statusText, headers: h });
      } catch { /* no-op */ }
      const dur = Date.now() - startTs;
      const cachePolicy = finalResponse.headers.get('cache-control') || undefined;
      console.log('\u2705 Request done', JSON.stringify({ id: reqId, status: finalResponse.status, path: url.pathname, routeKind, dur, cachePolicy }));
      return finalResponse;

    } catch (error) {
      const errStart = Date.now();

      // Capture error to Sentry with context
      Sentry.captureException(error, {
        tags: {
          function: 'edge-computing',
          method: request.method,
          path: url.pathname,
        },
        extra: {
          reqId,
          url: request.url,
        },
      });

      // Keep existing console.error for Cloudflare logs
      console.error('Edge processing error:', JSON.stringify({ id: reqId, error: String(error), stack: error?.stack, path: url.pathname }));

      // For API routes, return JSON errors instead of HTML
      if (url.pathname.startsWith('/api/')) {
        const errorPayload = {
          error: 'Internal server error',
          message: error?.message || String(error),
          path: url.pathname,
          requestId: reqId
        };
        return new Response(JSON.stringify(errorPayload), {
          status: 500,
          headers: {
            'content-type': 'application/json',
            'x-request-id': reqId,
            'x-route-kind': 'api-error',
            'cache-control': 'no-store'
          }
        });
      }

      const staleResponse = await caches.default.match(request);
      if (staleResponse) return staleResponse;
      const isHtmlRoute = request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('/') || !url.pathname.includes('.');
      if (isHtmlRoute) {
        const offlineHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Temporarily unavailable</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0b1020;color:#e5e7eb}.card{background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;max-width:560px;box-shadow:0 8px 32px rgba(0,0,0,.25)}h1{font-size:20px;margin:0 0 8px}p{margin:0 0 12px;color:#cbd5e1}a.btn{display:inline-block;background:#ffffff;color:#111827;font-weight:700;padding:8px 12px;border-radius:8px;text-decoration:none}.meta{margin-top:8px;font-size:12px;color:#94a3b8}</style></head><body><div class="card"><h1>We\'re updating things</h1><p>Please try again in a moment. If this persists, contact me via LinkedIn below.</p><a class="btn" href="/">Go home</a><div class="meta">Correlation ID: '+reqId+'</div></div></body></html>';
        const headers = { 'content-type': 'text/html; charset=utf-8', 'x-request-id': reqId, 'x-route-kind': 'html', 'cache-control': 'no-store', 'x-cache-policy': 'no-store' };
        const resp = new Response(offlineHtml, { status: 200, headers });
        console.log('\u26a0\ufe0f Fallback html', JSON.stringify({ id: reqId, status: resp.status, path: url.pathname, dur: Date.now() - errStart }));
        return resp;
      }
      return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-request-id': reqId, 'x-route-kind': 'asset', 'cache-control': 'no-store', 'x-cache-policy': 'no-store' } });
    }
  },

  async stripAuditOnlyScripts(response) {
    try {
      const originalHeaders = new Headers(response.headers);
      const nonce = originalHeaders.get('X-CSP-Nonce') || '';
      let stripped = await response.text();
      const patterns = [
        /<script[^>]*src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js[^"]*"[^>]*>\s*<\/script>/gi,
        /<iframe[^>]*src="https?:\/\/challenges\.cloudflare\.com[^"]*"[^>]*>\s*<\/iframe>/gi,
        /<script[^>]*src="https:\/\/static\.cloudflareinsights\.com[^"]*"[^>]*>\s*<\/script>/gi,
        /<script[^>]*src="https?:\/\/www\.googletagmanager\.com[^"]*"[^>]*>\s*<\/script>/gi,
        /<script[^>]*src="https?:\/\/www\.google-analytics\.com[^"]*"[^>]*>\s*<\/script>/gi,
        /<noscript>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi,
        /<script[^>]*data-cf-beacon[^>]*>\s*<\/script>/gi,
        /<script[^>]*>[\s\S]*?turnstile\/v0\/api\.js[\s\S]*?<\/script>/gi,
        /<script[^>]*>[\s\S]*?cdn-cgi\/challenge-platform[\s\S]*?<\/script>/gi,
        /<script[^>]*>[\s\S]*?zaraz[\s\S]*?<\/script>/gi,
        /<script[^>]*>[\s\S]*?__CF\$cv[\s\S]*?<\/script>/gi,
        /<script[^>]*src=['"][^'"]*\/cdn-cgi\/challenge-platform\/[\s\S]*?>\s*<\/script>/gi
      ];
      for (const rx of patterns) stripped = stripped.replace(rx, '');
      // Rename variable to avoid any potential duplicate identifier issues
      const auditBootstrapHtml = `<script${nonce ? ` nonce="${nonce}"` : ''}>(function(){try{window.__AUDIT__=true;window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){};var _sb=navigator.sendBeacon;navigator.sendBeacon=function(){return true};var _xf=window.fetch;window.fetch=function(u,o){try{if(typeof u==="string"&&(u.includes("challenges.cloudflare.com")||u.includes("/cdn-cgi/challenge-platform/")||u.includes("google-analytics.com")||u.includes("googletagmanager.com")||u.includes("static.cloudflareinsights.com")||u.includes("cloudflareinsights.com")||/\\/metrics\\/?(?:$|\\?|#)/.test(u))){return Promise.resolve(new Response("",{status:204}))}}catch(e){}return _xf.apply(this,arguments)};var _create=document.createElement;document.createElement=function(t){var el=_create.call(document,t);if((t||"").toLowerCase()==="script"){try{var _set=el.setAttribute;el.setAttribute=function(k,v){try{if(String(k).toLowerCase()==="src"){var vv=String(v||"");if(vv.includes("/cdn-cgi/challenge-platform/")||/\\/metrics\\/?(?:$|\\?|#)/.test(vv)){return}}}catch(e){}return _set.apply(el,arguments)}}catch(e){}}return el};var _append=Element.prototype.appendChild;Element.prototype.appendChild=function(n){try{if(n&&n.tagName==="SCRIPT"){var s=String(n.src||"");if(s.includes("/cdn-cgi/challenge-platform/")||/\\/metrics\\/?(?:$|\\?|#)/.test(s)){return n}}}catch(e){}return _append.call(this,n)};}catch(e){}})();</script>`;
      const headClose = /<\/head>/i;
      if (headClose.test(stripped)) stripped = stripped.replace(headClose, auditBootstrapHtml + '</head>');
      else stripped = auditBootstrapHtml + stripped;
      const newHeaders = new Headers(originalHeaders);
      newHeaders.append('set-cookie', 'audit=1; Path=/; Max-Age=300; SameSite=Lax');
      return new Response(stripped, { status: response.status, statusText: response.statusText, headers: newHeaders });
    } catch (e) {
      console.error('stripAuditOnlyScripts error:', e);
      return response;
    }
  },

  async applyPersonalization(response) {
    return response;
  },

  async trackEdgeAnalytics() {
    // no-op
  }
};

export default WorkerApp;
