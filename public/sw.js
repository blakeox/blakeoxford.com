// Service Worker for advanced caching and performance
const CACHE_NAME = 'blakeoxford-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/about/',
  '/assets/js/critical.min.js',
  '/assets/js/lazy-loader.min.js',
  '/assets/css/critical.css',
  '/assets/images/Blake-O-scaled.jpg',
  '/manifest.webmanifest'
];

// Network-first strategy for dynamic content
const DYNAMIC_CACHE_PATTERNS = [
  /\/api\//,
  /\/projects\//,
  /\/blog\//
];

// Cache-first strategy for static assets
const STATIC_CACHE_PATTERNS = [
  /\/assets\//,
  /\.(?:png|jpg|jpeg|svg|webp|avif|css|js|woff|woff2)$/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE_NAME && 
            cacheName !== DYNAMIC_CACHE_NAME
          )
          .map(cacheName => caches.delete(cacheName))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle static assets with cache-first strategy
  if (STATIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
    );
    return;
  }

  // Handle dynamic content with network-first strategy
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
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

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});
