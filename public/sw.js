// Enhanced Service Worker for PWA optimization
const CACHE_NAME = 'blakeoxford-v2';
const STATIC_CACHE_NAME = 'static-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-v2';
const RUNTIME_CACHE_NAME = 'runtime-v2';

// Critical assets to cache immediately for offline functionality
const STATIC_ASSETS = [
  '/',
  '/about/',
  '/projects/',
  '/contact/',
  '/blog/',
  '/assets/js/lazy-loader.min.js',
  '/assets/js/lazy-loader.min.js?v=2',
  '/assets/js/performance-monitor.js',
  '/assets/js/resource-preloader.js',
  '/assets/js/pwa-enhancer.js',
  '/assets/images/optimized/avif/Blake-O-scaled@320w.avif',
  '/manifest.webmanifest'
];

// Network-first strategy for dynamic content
const DYNAMIC_CACHE_PATTERNS = [
  /\/api\//,
  /\/projects\//,
  /\/blog\//,
  /\/search\//
];

// Cache-first strategy for static assets
const STATIC_CACHE_PATTERNS = [
  /\/assets\//,
  /\.(?:png|jpg|jpeg|svg|webp|avif|css|js|woff|woff2|pdf)$/
];

// Cache duration for different content types
const CACHE_DURATIONS = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  dynamic: 7 * 24 * 60 * 60 * 1000, // 7 days
  runtime: 24 * 60 * 60 * 1000       // 1 day
};

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName =>
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== RUNTIME_CACHE_NAME
            )
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        )
      ),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never cache or intercept the health/metrics endpoints
  if (
    url.pathname === '/_healthz' || url.pathname === '/_healthz/' ||
    url.pathname === '/metrics' || url.pathname === '/metrics/'
  ) {
    return; // allow network to proceed, do not cache
  }

  // Handle static assets with cache-first strategy
  if (STATIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            });
        })
        .catch(() => {
          // Return offline fallback for critical assets
          if (url.pathname.includes('/assets/images/')) {
            return caches.match('/assets/images/offline-placeholder.png');
          }
        })
    );
    return;
  }

  // Handle dynamic content with network-first strategy
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default: network-first with cache fallback for navigation
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Handle background sync for enhanced offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(
      // Add any background sync logic here
      Promise.resolve()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/assets/images/icon-192x192.png',
      badge: '/assets/images/favicon-96x96.png',
      vibrate: [100, 50, 100]
    };
    
    event.waitUntil(
      self.registration.showNotification('Blake Oxford Portfolio', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
