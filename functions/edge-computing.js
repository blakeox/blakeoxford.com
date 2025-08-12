/**
 * Cloudflare Workers Edge Computing Enhancement
 * Advanced edge-side processing for maximum performance
 */
import { onRequestPost as handleSendEmail } from './send-email.js';

// Edge-side A/B testing and personalization
class EdgePersonalization {
  constructor(request, env) {
    this.request = request;
    this.env = env;
    this.country = request.cf?.country || 'US';
    this.userAgent = request.headers.get('user-agent') || '';
    this.cookies = this.parseCookies(request.headers.get('cookie') || '');
  }

  // Parse cookies from header
  parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  // Determine user segment for personalization
  getUserSegment() {
    const segments = [];

    // Geographic segmentation
    if (['US', 'CA', 'UK', 'AU'].includes(this.country)) {
      segments.push('english-primary');
    }

    // Device segmentation
    if (this.userAgent.includes('Mobile')) {
      segments.push('mobile-user');
    } else {
      segments.push('desktop-user');
    }

    // Returning visitor segmentation
    if (this.cookies.returning_visitor === 'true') {
      segments.push('returning-visitor');
    } else {
      segments.push('new-visitor');
    }

    // Time-based segmentation
    const hour = new Date().getUTCHours();
    if (hour >= 9 && hour <= 17) {
      segments.push('business-hours');
    } else {
      segments.push('after-hours');
    }

    return segments;
  }

  // A/B test configuration
  getABTestVariant() {
    const userId = this.cookies.user_id || this.generateUserId();
    const hash = this.hashCode(userId);

    // Simple A/B test: 50/50 split
    const variant = (hash % 100) < 50 ? 'A' : 'B';

    return {
      variant,
      userId,
      testName: 'hero-optimization-v1'
    };
  }

  // Generate consistent user ID
  generateUserId() {
    const ip = this.request.headers.get('cf-connecting-ip') || 'unknown';
    const ua = this.userAgent.slice(0, 50);
    return this.hashCode(ip + ua).toString();
  }

  // Simple hash function for consistent bucketing
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Edge-side caching strategies
class EdgeCacheManager {
  constructor(request, env) {
    this.request = request;
    this.env = env;
    this.url = new URL(request.url);
  }

  // Determine cache strategy based on request
  getCacheStrategy() {
    const path = this.url.pathname;
    const extension = path.split('.').pop();

    // Robots.txt and other plain text directives - short cache and no-transform
    if (path.endsWith('/robots.txt')) {
      return {
        ttl: 300, // 5 minutes
        strategy: 'no-transform',
        headers: {
          'Cache-Control': 'public, max-age=300, no-transform',
          'CDN-Cache-Control': 'max-age=300'
        }
      };
    }

    // Static assets - long cache
    if (['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'woff2'].includes(extension)) {
      return {
        ttl: 31536000, // 1 year
        strategy: 'immutable',
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'max-age=31536000'
        }
      };
    }

    // API endpoints - short cache with stale-while-revalidate
    if (path.startsWith('/api/')) {
      return {
        ttl: 300, // 5 minutes
        strategy: 'stale-while-revalidate',
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
          'CDN-Cache-Control': 'max-age=3600'
        }
      };
    }

    // Cloudflare Zaraz beacon/script path (if present)
    if (path.startsWith('/cdn-cgi/zaraz/')) {
      return {
        ttl: 86400, // 1 day
        strategy: 'immutable',
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'CDN-Cache-Control': 'max-age=86400'
        }
      };
    }

    // HTML pages - edge-side includes
    return {
      ttl: 3600, // 1 hour
      strategy: 'edge-side-includes',
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'CDN-Cache-Control': 'max-age=3600'
      }
    };
  }

  // Generate cache key with personalization
  getCacheKey(segments = []) {
    const baseKey = this.url.pathname + this.url.search;
    const segmentKey = segments.sort().join('-');
    return segmentKey ? `${baseKey}:${segmentKey}` : baseKey;
  }
}

// Edge-side performance optimization
class EdgePerformanceOptimizer {
  constructor(response, request) {
    this.response = response;
    this.request = request;
    this.url = new URL(request.url);
  }

  // Optimize response based on client capabilities
  async optimizeResponse() {
    let optimizedResponse = this.response;

    // Apply compression
    optimizedResponse = await this.applyCompression(optimizedResponse);

    // Add performance headers
    optimizedResponse = this.addPerformanceHeaders(optimizedResponse);

    // Apply security headers
    optimizedResponse = this.addSecurityHeaders(optimizedResponse);

    // Add resource hints
    optimizedResponse = this.addResourceHints(optimizedResponse);

    return optimizedResponse;
  }

  // Apply optimal compression
  async applyCompression(response) {
    const acceptEncoding = this.request.headers.get('accept-encoding') || '';

    // Prefer Brotli, fallback to gzip
    if (acceptEncoding.includes('br')) {
      // Brotli compression would be handled by Cloudflare automatically
      return response;
    } else if (acceptEncoding.includes('gzip')) {
      // Gzip compression would be handled by Cloudflare automatically
      return response;
    }

    return response;
  }

  // Add performance-optimized headers
  addPerformanceHeaders(response) {
    const headers = new Headers(response.headers);

  // Early hints for critical resources
  headers.set('Link', '</assets/css/critical.css>; rel=preload; as=style');

    // Connection optimization
    headers.set('Connection', 'keep-alive');

    // HTTP/3 indication
    headers.set('Alt-Svc', 'h3=":443"; ma=86400');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Add security headers
  addSecurityHeaders(response) {
    const headers = new Headers(response.headers);

    // Content Security Policy
    headers.set('Content-Security-Policy', [
      'default-src \'self\'',
      // Allow GA and GTM scripts; Cloudflare Insights (if injected) to avoid console CSP errors
      'script-src \'self\' \'unsafe-inline\' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com',
      'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
      'font-src \'self\' https://fonts.gstatic.com',
      'img-src \'self\' data: https:',
      // Permit GA and DoubleClick beacons; keep tight otherwise
      'connect-src \'self\' https://www.google-analytics.com https://stats.g.doubleclick.net',
      // Align with static headers
      'manifest-src \'self\'',
      'worker-src \'self\''
    ].join('; '));

    // Other security headers
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Add intelligent resource hints
  addResourceHints(response) {
    const headers = new Headers(response.headers);
    const path = this.url.pathname;

    // Page-specific resource hints
    if (path === '/') {
      headers.append('Link', '</about>; rel=prefetch');
      headers.append('Link', '</projects>; rel=prefetch');
    } else if (path === '/projects') {
      headers.append('Link', '</api/projects.json>; rel=prefetch; as=fetch');
    } else if (path === '/blog') {
      headers.append('Link', '</api/blog.json>; rel=prefetch; as=fetch');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
}

// Main Cloudflare Worker
const WorkerApp = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
  const method = request.method || 'GET';

    // Enforce HTTPS and canonical host (www -> apex) for production domain
  try {
      const host = url.hostname;
      const isGetLike = request.method === 'GET' || request.method === 'HEAD';
      const isProdDomain = host.endsWith('blakeoxford.com');

      // Force HTTPS
      if (isProdDomain && url.protocol === 'http:' && isGetLike) {
        url.protocol = 'https:';
        return Response.redirect(url.toString(), 308);
      }

      // Canonicalize host: www -> apex
      if (isProdDomain && host.startsWith('www.') && isGetLike) {
        url.hostname = host.replace(/^www\./, '');
        return Response.redirect(url.toString(), 308);
      }
  } catch {
      // Non-fatal; continue if redirect logic fails
    }

    // Special route: robots.txt (serve as strict text; avoid any HTML optimizations)
    // Serve a favicon.ico even if only PNGs exist; rewrite to local 32x32 PNG
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
        return new Response(null, { status: 404 });
      }
    }

    // Special route: robots.txt (serve as strict text; avoid any HTML optimizations)
    if (url.pathname === '/robots.txt') {
      try {
        let robots = await env.ASSETS.fetch(request);
        if (!robots.ok) return robots;
        const headers = new Headers(robots.headers);
        headers.set('content-type', 'text/plain; charset=utf-8');
        headers.set('cache-control', 'public, max-age=300, no-transform');
        return new Response(robots.body, { status: robots.status, statusText: robots.statusText, headers });
  } catch {
        return new Response('User-agent: *\nAllow: /\n', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, no-transform' }
        });
      }
    }

    // Route: Contact form submission handled by existing function
    if (url.pathname === '/send-email' && request.method === 'POST') {
      // Bridge Pages Function signature to Worker
      return handleSendEmail({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
    }

    // Initialize edge services
    const personalization = new EdgePersonalization(request, env);
    const cacheManager = new EdgeCacheManager(request, env);

    // Compute segments/AB test (used only for GET personalization)
    const userSegments = personalization.getUserSegment();
    const abTest = personalization.getABTestVariant();

    // Cache strategy for this path
    const cacheStrategy = cacheManager.getCacheStrategy();

    // GET-only cache lookup
    if (method === 'GET') {
      const cacheKey = cacheManager.getCacheKey(userSegments);
      const cacheResponse = await caches.default.match(request, {
        ignoreMethod: false
      });
      if (cacheResponse) {
        console.log('✅ Edge cache hit:', cacheKey);
        return cacheResponse;
      }
    }

    try {
      // Fetch from static assets (dist) via binding
      let originResponse = await env.ASSETS.fetch(request);

      // If asset not found and requesting a clean URL without extension, try adding trailing index.html
      if (originResponse.status === 404 && !url.pathname.includes('.') && !url.pathname.endsWith('/index.html')) {
        const altUrl = new URL(url);
        altUrl.pathname = url.pathname.replace(/\/$/, '') + '/index.html';
        originResponse = await env.ASSETS.fetch(new Request(altUrl.toString(), request));
      }

      if (!originResponse.ok) {
        return originResponse;
      }

  // Determine content type once
      const contentType = originResponse.headers.get('content-type') || '';

      // Ensure correct content-type for common static assets if missing
      if (!contentType) {
        const path = url.pathname.toLowerCase();
        const guess = path.endsWith('.css')
          ? 'text/css; charset=utf-8'
          : path.endsWith('.js')
            ? 'application/javascript; charset=utf-8'
            : path.endsWith('.json')
              ? 'application/json; charset=utf-8'
              : path.endsWith('.svg')
                ? 'image/svg+xml'
                : path.endsWith('.xml')
                  ? 'application/xml; charset=utf-8'
                  : path.endsWith('.txt')
                    ? 'text/plain; charset=utf-8'
                  : path.endsWith('.ico')
                    ? 'image/x-icon'
                    : '';
        if (guess) {
          const fixedHeaders = new Headers(originResponse.headers);
          fixedHeaders.set('content-type', guess);
          originResponse = new Response(originResponse.body, {
            status: originResponse.status,
            statusText: originResponse.statusText,
            headers: fixedHeaders
          });
        }
      }

      let finalResponse = originResponse;

      // Only optimize/personalize for GET HTML responses
      if (method === 'GET' && originResponse.headers.get('content-type')?.includes('text/html')) {
        const optimizer = new EdgePerformanceOptimizer(originResponse, request);
        finalResponse = await optimizer.optimizeResponse();
        finalResponse = await WorkerApp.applyPersonalization(finalResponse, userSegments, abTest);
      }

      // Cache GET responses with a readable body only
      if (method === 'GET' && cacheStrategy.ttl > 0 && finalResponse.body) {
        const cacheHeaders = new Headers(finalResponse.headers);
        Object.entries(cacheStrategy.headers).forEach(([key, value]) => {
          cacheHeaders.set(key, value);
        });

        const [forCache, forReturn] = finalResponse.body.tee();
        const cacheResponse = new Response(forCache, {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          headers: cacheHeaders
        });

        ctx.waitUntil(caches.default.put(request, cacheResponse));
        finalResponse = new Response(forReturn, {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          headers: finalResponse.headers
        });
      }

  // Add analytics tracking (best-effort)
  ctx.waitUntil(WorkerApp.trackEdgeAnalytics(request, userSegments, abTest, env));

      return finalResponse;

    } catch (error) {
      console.error('Edge processing error:', error);

      // Return cached stale content if available
      const staleResponse = await caches.default.match(request);
      if (staleResponse) {
        return staleResponse;
      }

      // Fallback error response
      return new Response('Service temporarily unavailable', {
        status: 503,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '60'
        }
      });
    }
  },

  // Apply personalization to HTML content
  async applyPersonalization(response, userSegments, abTest) {
    const html = await response.text();

    // Simple personalization examples
    let personalizedHTML = html;

    // A/B test hero section
    if (abTest.variant === 'B') {
      personalizedHTML = personalizedHTML.replace(
        '<h1 class="hero-title">',
        '<h1 class="hero-title hero-variant-b">'
      );
    }

    // Segment-based content
    if (userSegments.includes('returning-visitor')) {
      personalizedHTML = personalizedHTML.replace(
        '{{welcome_message}}',
        'Welcome back!'
      );
    } else {
      personalizedHTML = personalizedHTML.replace(
        '{{welcome_message}}',
        'Welcome to Blake Oxford\'s Portfolio!'
      );
    }

    // Geographic personalization
    if (userSegments.includes('english-primary')) {
      personalizedHTML = personalizedHTML.replace(
        '{{contact_cta}}',
        'Get in touch'
      );
    }

    // Add A/B test tracking
    personalizedHTML = personalizedHTML.replace(
      '</head>',
      `<script>
        window.abTest = ${JSON.stringify(abTest)};
        window.userSegments = ${JSON.stringify(userSegments)};
      </script></head>`
    );

    return new Response(personalizedHTML, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  },

  // Track edge-side analytics
  async trackEdgeAnalytics(request, userSegments, abTest, env) {
    const analytics = {
      timestamp: Date.now(),
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      country: request.cf?.country,
      userSegments: userSegments,
      abTest: abTest,
      colo: request.cf?.colo, // Cloudflare data center
      asn: request.cf?.asn    // Autonomous System Number
    };

    // Send to analytics service (would be actual implementation)
    console.log('📊 Edge analytics:', analytics);

    // Store in Cloudflare Analytics Engine if available
    if (env.ANALYTICS_ENGINE) {
      await env.ANALYTICS_ENGINE.writeDataPoint({
        blobs: [
          analytics.url,
          analytics.country,
          abTest.variant
        ],
        doubles: [
          Date.now()
        ],
        indexes: [
          analytics.country
        ]
      });
    }
  }
};

export default WorkerApp;
