/**
 * Cloudflare Workers Edge Computing Enhancement
 * Advanced edge-side processing for maximum performance
 */

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
    headers.set('Link', [
      '</assets/css/critical.css>; rel=preload; as=style',
      '</assets/js/main.js>; rel=preload; as=script',
      '</assets/fonts/OpenSans-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
    ].join(', '));

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
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.google-analytics.com"
    ].join('; '));

    // Other security headers
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

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
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Initialize edge services
    const personalization = new EdgePersonalization(request, env);
    const cacheManager = new EdgeCacheManager(request, env);
    
    // Get user segmentation
    const userSegments = personalization.getUserSegment();
    const abTest = personalization.getABTestVariant();
    
    // Generate cache key with personalization
    const cacheKey = cacheManager.getCacheKey(userSegments);
    const cacheStrategy = cacheManager.getCacheStrategy();
    
    // Try to get from edge cache first
    const cacheResponse = await caches.default.match(request, {
      ignoreMethod: false
    });
    
    if (cacheResponse) {
      console.log('✅ Edge cache hit:', cacheKey);
      return cacheResponse;
    }

    try {
      // Fetch from origin
      const originResponse = await fetch(request);
      
      if (!originResponse.ok) {
        return originResponse;
      }

      // Apply edge-side optimizations
      const optimizer = new EdgePerformanceOptimizer(originResponse, request);
      let optimizedResponse = await optimizer.optimizeResponse();

      // Apply personalization for HTML responses
      if (optimizedResponse.headers.get('content-type')?.includes('text/html')) {
        optimizedResponse = await this.applyPersonalization(optimizedResponse, userSegments, abTest);
      }

      // Cache the response
      if (cacheStrategy.ttl > 0) {
        const cacheHeaders = new Headers(optimizedResponse.headers);
        Object.entries(cacheStrategy.headers).forEach(([key, value]) => {
          cacheHeaders.set(key, value);
        });

        const cacheResponse = new Response(optimizedResponse.body.tee()[0], {
          status: optimizedResponse.status,
          statusText: optimizedResponse.statusText,
          headers: cacheHeaders
        });

        ctx.waitUntil(caches.default.put(request, cacheResponse));
      }

      // Add analytics tracking
      ctx.waitUntil(this.trackEdgeAnalytics(request, userSegments, abTest, env));

      return optimizedResponse;

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
