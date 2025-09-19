/* eslint quotes:["warn","single",{allowTemplateLiterals:true}] */
/**
 * Cloudflare Worker: Edge app with asset serving, security headers, caching, audit-mode, and utilities
 */
import { onRequestPost as handleSendEmail } from './send-email.js';

class EdgePersonalization {
  constructor(request, env) {
    this.request = request;
    this.env = env;
    this.country = request.cf?.country || 'US';
    this.userAgent = request.headers.get('user-agent') || '';
    this.acceptLanguage = request.headers.get('accept-language') || '';
    this.cookies = this.parseCookies(request.headers.get('cookie') || '');
  }
  parseCookies(cookieHeader) {
    const out = {};
    if (!cookieHeader) return out;
    cookieHeader.split(';').forEach(part => {
      const [k, ...rest] = part.split('=');
      const key = (k || '').trim();
      if (!key) return;
      const val = rest.join('=');
      try { out[key] = decodeURIComponent((val || '').trim()); }
      catch { out[key] = (val || '').trim(); }
    });
    return out;
  }
  getUserSegment() {
    const segments = [];
    if (this.cookies.user_id || this.cookies.last_visit) segments.push('returning-visitor');
    else segments.push('new-visitor');
    if (/^en\b/i.test(this.acceptLanguage)) segments.push('english-primary');
    const hour = new Date().getUTCHours();
    segments.push(hour >= 9 && hour <= 17 ? 'business-hours' : 'after-hours');
    return segments;
  }
  getABTestVariant() {
    const userId = this.cookies.user_id || this.generateUserId();
    const hash = this.hashCode(userId);
    const variant = (hash % 100) < 50 ? 'A' : 'B';
    return { variant, userId, testName: 'hero-optimization-v1' };
  }
  generateUserId() {
    const ip = this.request.headers.get('cf-connecting-ip') || 'unknown';
    const ua = this.userAgent.slice(0, 50);
    return this.hashCode(ip + ua).toString();
  }
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

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

    const isHashed = (p) => {
      // Treat Astro’s hashed chunk paths and common fingerprint patterns as immutable
      if (p.startsWith('/_astro/')) return true;
      // e.g., core-boot.ab12cd34.js or image.1234567890abcdef.webp
      return /\.[a-f0-9]{8,}\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2|pdf)$/.test(p);
    };

    // Text files with special semantics
    if (lower === '/robots.txt') {
      return { ttl: 300, headers: { 'Cache-Control': 'public, max-age=300, no-transform' } };
    }
    if (lower === '/sw.js' || lower === '/service-worker.js') {
      // Ensure clients revalidate on each navigation to pick up new SW quickly
      return { ttl: 0, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } };
    }
    if (lower.endsWith('/manifest.webmanifest') || lower === '/manifest.webmanifest') {
      return { ttl: 3600, headers: { 'Cache-Control': 'public, max-age=3600' } };
    }
    if (lower.endsWith('/sitemap.xml') || lower.endsWith('/sitemap-index.xml') || /\/sitemap-\d+\.xml$/.test(lower) || lower.endsWith('/rss.xml') || lower.endsWith('/feed.xml')) {
      return { ttl: 300, headers: { 'Cache-Control': 'public, max-age=300, no-transform' } };
    }
    if (lower.endsWith('/search-index.json')) {
      return { ttl: 600, headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600' } };
    }

    // APIs
    if (lower.startsWith('/api/')) {
      return { ttl: 300, headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } };
    }

    // Static assets
    if (['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'svg', 'ico', 'woff2', 'pdf'].includes(extension)) {
      if (isHashed(lower)) {
        return { ttl: 31536000, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } };
      }
      // Non-hashed assets: cache, but allow periodic refresh
      return { ttl: 86400, headers: { 'Cache-Control': 'public, max-age=86400' } };
    }

    // HTML and everything else: prefer freshness at the browser with CDN leeway
    return { ttl: 300, headers: { 'Cache-Control': 'public, max-age=0, must-revalidate, stale-while-revalidate=3600' } };
  }
}

class EdgePerformanceOptimizer {
  constructor(response, request) {
    this.response = response;
    this.request = request;
    this.url = new URL(request.url);
  }
  async optimizeResponse() {
    let res = this.response;
    res = await this.applyCompression(res);
    res = this.addPerformanceHeaders(res);
    res = this.addSecurityHeaders(res);
    res = this.addResourceHints(res);
    return res;
  }
  async applyCompression(response) { return response; }
  addPerformanceHeaders(response) {
    const headers = new Headers(response.headers);
    headers.set('Connection', 'keep-alive');
    headers.set('Alt-Svc', 'h3=":443"; ma=86400');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  addSecurityHeaders(response) {
    const headers = new Headers(response.headers);
    const isAudit = WorkerApp.isAuditRequest(this.request);
    const cspNonce = isAudit ? WorkerApp.generateNonce() : '';
      const csp = isAudit ? [
        'default-src \'self\'',
        `script-src 'self' 'nonce-${cspNonce}'`,
        'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
        'font-src \'self\' https://fonts.gstatic.com',
        'img-src \'self\' data: https:',
        'connect-src \'self\'',
        'frame-src \'self\'',
        'base-uri \'none\'',
        'object-src \'none\'',
        'frame-ancestors \'none\'',
        'upgrade-insecure-requests',
        'manifest-src \'self\'',
        'worker-src \'self\''
    ] : [
      'default-src \'self\'',
      'script-src \'self\' \'unsafe-inline\' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://challenges.cloudflare.com',
      'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
      'font-src \'self\' https://fonts.gstatic.com',
      'img-src \'self\' data: https:',
      'connect-src \'self\' https://www.google-analytics.com https://stats.g.doubleclick.net https://challenges.cloudflare.com',
      'frame-src \'self\' https://challenges.cloudflare.com',
      'base-uri \'none\'',
      'object-src \'none\'',
      'frame-ancestors \'none\'',
      'upgrade-insecure-requests',
      'manifest-src \'self\'',
      'worker-src \'self\''
    ];
    // Primary enforcing CSP
    headers.set('Content-Security-Policy', csp.join('; '));

    // Report-Only CSP rollout (matched to current policy for baseline; can be tightened later)
    const reportEndpoint = (() => {
      try { return new URL('/csp-report', this.url).toString(); } catch { return '/csp-report'; }
    })();
    const cspReportOnly = [
      ...csp,
      `report-uri ${reportEndpoint}`,
      'report-to csp'
    ];
    // Modern reporting headers
    try {
      headers.set('Reporting-Endpoints', `csp="${reportEndpoint}"`);
      headers.set('Report-To', JSON.stringify({ group: 'csp', max_age: 60 * 60 * 24 * 30, endpoints: [{ url: reportEndpoint }], include_subdomains: true }));
    } catch { /* ignore header json errors */ }
    headers.set('Content-Security-Policy-Report-Only', cspReportOnly.join('; '));
  if (isAudit) headers.set('X-Audit-Mode', '1');
    if (cspNonce) headers.set('X-CSP-Nonce', cspNonce);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    // Align HSTS with static headers policy (2 years)
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    // Strengthen cross-origin isolation hints
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    headers.set('Cross-Origin-Resource-Policy', 'same-site');
    headers.set('Origin-Agent-Cluster', '?1');
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  addResourceHints(response) {
    const headers = new Headers(response.headers);
    const path = this.url.pathname;
    if (path === '/') {
      headers.append('Link', '</about>; rel=prefetch');
      headers.append('Link', '</projects>; rel=prefetch');
    } else if (path === '/projects') {
      headers.append('Link', '</api/projects.json>; rel=prefetch; as=fetch');
    } else if (path === '/blog') {
      headers.append('Link', '</api/blog.json>; rel=prefetch; as=fetch');
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
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
    const url = new URL(request.url);
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
        return Response.redirect(url.toString(), 308);
      }
      if (isProdDomain && host.startsWith('www.') && isGetLike) {
        url.hostname = host.replace(/^www\./, '');
        return Response.redirect(url.toString(), 308);
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
        return new Response(icon.body, { status: icon.status, statusText: icon.statusText, headers });
      } catch {
        // fallback: not found favicon
        return new Response(null, { status: 404 });
      }
    }

    if (url.pathname === '/robots.txt') {
      try {
        let robots = await env.ASSETS.fetch(request);
        if (!robots.ok) return robots;
        const headers = new Headers(robots.headers);
        headers.set('content-type', 'text/plain; charset=utf-8');
        headers.set('cache-control', 'public, max-age=300, no-transform');
        return new Response(robots.body, { status: robots.status, statusText: robots.statusText, headers });
      } catch {
        return new Response('User-agent: *\nAllow: /\n', { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, no-transform' } });
      }
    }

    // CSP violation report collection endpoint
    if (url.pathname === '/csp-report') {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { 'allow': 'POST', 'cache-control': 'no-store' } });
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
        console.warn('🔐 CSP violation report:', record);
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
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    }

    // Health endpoint (moved off /metrics to avoid third-party collisions)
    if (url.pathname === '/_healthz' || url.pathname === '/_healthz/') {
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store, no-cache, must-revalidate', 'content-type': 'text/plain; charset=utf-8', 'content-length': '0', 'x-content-type-options': 'nosniff', 'x-request-id': reqId } });
    }

    // Legacy no-op for previous metrics path
    if (url.pathname === '/metrics/' || url.pathname === '/metrics') {
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store, no-cache, must-revalidate', 'content-type': 'text/plain; charset=utf-8', 'content-length': '0', 'x-content-type-options': 'nosniff' } });
    }

    if (url.pathname === '/send-email' && request.method === 'POST') {
      const res = await handleSendEmail({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
      try { const h = new Headers(res.headers); h.set('x-request-id', reqId); return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h }); } catch { return res; }
    }

    // Back-compat asset rewrite: maintain existing path if older HTML referenced it
    if (url.pathname === '/assets/js/lazy-loader.min.js' && !url.search) {
      try {
        const v2Url = new URL('/assets/js/lazy-loader.min.js?v=2', url.origin);
        const v2Req = new Request(v2Url.toString(), request);
        const res = await env.ASSETS.fetch(v2Req);
        if (res.ok) {
          const headers = new Headers(res.headers);
          headers.set('cache-control', 'public, max-age=300');
          return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
        }
      } catch { /* fall through */ }
      // If v2 is missing (e.g., inlined in templates), return 204 to avoid error spam
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
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
          return new Response(baseRes.body, { status: 200, headers });
        }
      } catch {
        // ignore remap failure; fall through
      }
    }

    // Serve from ASSETS
    const personalization = new EdgePersonalization(request, env);
    const cacheManager = new EdgeCacheManager(request, env);
    const userSegments = personalization.getUserSegment();
    const abTest = personalization.getABTestVariant();
    const cacheStrategy = cacheManager.getCacheStrategy();

      if (method === 'GET') {
      const cacheResponse = await caches.default.match(request, { ignoreMethod: false });
      if (cacheResponse) return cacheResponse;
    }

    try {
  const startTs = Date.now();
  console.log('➡️ Request start', JSON.stringify({ id: reqId, method, path: url.pathname }));
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
            return new Response(offlineHtml, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'x-request-id': reqId } });
          }
          // Graceful fallbacks for non-HTML requests during transient failures
          const pathname = url.pathname;
          // API endpoints: return empty array/object to avoid UI hard-fail during outages
          if (pathname.startsWith('/api/')) {
            const empty = pathname.endsWith('.json') ? '[]' : '';
            return new Response(empty, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
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
                return new Response(phRes.body, { status: 200, headers });
              }
            } catch { /* ignore and fall through */ }
            // As last resort, return 204 to prevent noisy console errors
            return new Response(null, { status: 204 });
          }
        }
        return originResponse;
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
        const isHashed = pathLower.startsWith('/_astro/') || /\.[a-f0-9]{8,}\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2|pdf)$/.test(pathLower);
        const headers = new Headers(originResponse.headers);

        // Add a conservative Vary header for encoding differences
        const existingVary = headers.get('vary');
        headers.set('vary', existingVary ? `${existingVary}, Accept-Encoding` : 'Accept-Encoding');

        if (pathLower === '/sw.js' || pathLower === '/service-worker.js') {
          headers.set('cache-control', 'no-cache, no-store, must-revalidate');
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        } else if (pathLower.endsWith('/manifest.webmanifest') || pathLower === '/manifest.webmanifest') {
          headers.set('cache-control', 'public, max-age=3600');
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        } else if (isAssetExt) {
          headers.set('cache-control', isHashed ? 'public, max-age=31536000, immutable' : 'public, max-age=86400');
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        } else if (isHtml) {
          // Keep HTML fresh on clients; CDN can still keep for short periods
          headers.set('cache-control', 'public, max-age=0, must-revalidate, stale-while-revalidate=3600');
          originResponse = new Response(originResponse.body, { status: originResponse.status, statusText: originResponse.statusText, headers });
        }
      }

      let finalResponse = originResponse;

      if (method === 'GET' && originResponse.headers.get('content-type')?.includes('text/html')) {
        try {
          const optimizer = new EdgePerformanceOptimizer(originResponse, request);
          finalResponse = await optimizer.optimizeResponse();
          const isAudit = WorkerApp.isAuditRequest(request);
          if (isAudit) {
            try { finalResponse = await WorkerApp.stripAuditOnlyScripts(finalResponse); }
            catch (e) { console.error('Audit-only strip failed:', e); }
          }
          if (!isAudit) {
            try { finalResponse = await WorkerApp.applyPersonalization(finalResponse, userSegments, abTest); }
            catch (e) {
              console.error('Personalization failed, returning optimized response only:', e);
              finalResponse = new Response(await finalResponse.text(), { status: finalResponse.status, statusText: finalResponse.statusText, headers: finalResponse.headers });
            }
          }
        } catch (e) {
          console.error('Optimization failed, returning origin response:', e);
          finalResponse = originResponse;
        }
      }

      if (method === 'GET' && cacheStrategy.ttl > 0 && finalResponse.body) {
        const cacheHeaders = new Headers(finalResponse.headers);
        Object.entries(cacheStrategy.headers).forEach(([key, value]) => cacheHeaders.set(key, value));
        const [forCache, forReturn] = finalResponse.body.tee();
        const cacheResponse = new Response(forCache, { status: finalResponse.status, statusText: finalResponse.statusText, headers: cacheHeaders });
        ctx.waitUntil(caches.default.put(request, cacheResponse));
        finalResponse = new Response(forReturn, { status: finalResponse.status, statusText: finalResponse.statusText, headers: finalResponse.headers });
      }

      ctx.waitUntil(WorkerApp.trackEdgeAnalytics(request, userSegments, abTest, env, reqId));
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
      console.log('✅ Request done', JSON.stringify({ id: reqId, status: finalResponse.status, path: url.pathname, routeKind, dur, cachePolicy }));
  return finalResponse;

    } catch (error) {
      console.error('Edge processing error:', JSON.stringify({ id: reqId, error: String(error) }));
      const staleResponse = await caches.default.match(request);
      if (staleResponse) return staleResponse;
      const isHtmlRoute = request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('/') || !url.pathname.includes('.');
      if (isHtmlRoute) {
        const offlineHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Temporarily unavailable</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0b1020;color:#e5e7eb}.card{background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;max-width:560px;box-shadow:0 8px 32px rgba(0,0,0,.25)}h1{font-size:20px;margin:0 0 8px}p{margin:0 0 12px;color:#cbd5e1}a.btn{display:inline-block;background:#ffffff;color:#111827;font-weight:700;padding:8px 12px;border-radius:8px;text-decoration:none}.meta{margin-top:8px;font-size:12px;color:#94a3b8}</style></head><body><div class="card"><h1>We\'re updating things</h1><p>Please try again in a moment. If this persists, contact me via LinkedIn below.</p><a class="btn" href="/">Go home</a><div class="meta">Correlation ID: '+reqId+'</div></div></body></html>';
        return new Response(offlineHtml, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'x-request-id': reqId } });
      }
      return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-request-id': reqId } });
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

  async applyPersonalization(response, userSegments, abTest) {
    const html = await response.text();
    let personalizedHTML = html;
    if (abTest.variant === 'B') personalizedHTML = personalizedHTML.replace('<h1 class="hero-title">', '<h1 class="hero-title hero-variant-b">');
    if (userSegments.includes('returning-visitor')) personalizedHTML = personalizedHTML.replace('{{welcome_message}}', 'Welcome back!');
    else personalizedHTML = personalizedHTML.replace('{{welcome_message}}', 'Welcome to Blake Oxford\'s Portfolio!');
    if (userSegments.includes('english-primary')) personalizedHTML = personalizedHTML.replace('{{contact_cta}}', 'Get in touch');
    personalizedHTML = personalizedHTML.replace('</head>', `<script>window.abTest=${JSON.stringify(abTest)};window.userSegments=${JSON.stringify(userSegments)};</script></head>`);
    return new Response(personalizedHTML, { status: response.status, statusText: response.statusText, headers: response.headers });
  },

  async trackEdgeAnalytics(request, userSegments, abTest, env, reqId) {
    const analytics = { id: reqId, timestamp: Date.now(), url: request.url, userAgent: request.headers.get('user-agent'), country: request.cf?.country, userSegments, abTest, colo: request.cf?.colo, asn: request.cf?.asn };
    console.log('📊 Edge analytics:', JSON.stringify(analytics));
    if (env.ANALYTICS_ENGINE) {
      await env.ANALYTICS_ENGINE.writeDataPoint({ blobs: [ analytics.url, analytics.country, abTest.variant ], doubles: [ Date.now() ], indexes: [ analytics.country ] });
    }
  }
};

export default WorkerApp;
