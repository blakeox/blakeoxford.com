/* Core Boot Bundle: performance-monitor + resource-preloader + pwa-enhancer */

;(function(){
// ===== performance-monitor.js =====
/**
 * Core Web Vitals Monitoring & Performance Tracking
 * Real-time performance metrics collection and reporting
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.initialized = false;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  init() {
    if (this.initialized) return;
    this.setupCoreWebVitals();
    this.setupResourceTiming();
    this.setupNavigationTiming();
    this.setupLayoutShiftTracking();
    this.setupLongTaskTracking();
    this.initialized = true;
    console.log('🎯 Performance monitoring initialized');
  }
  setupCoreWebVitals() {
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', {
          value: lastEntry.startTime,
          timestamp: Date.now(),
          element: lastEntry.element?.tagName || 'unknown'
        });
        this.reportMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    }
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        this.metrics.set('FID', {
          value: firstInput.processingStart - firstInput.startTime,
          timestamp: Date.now(),
          eventType: firstInput.name
        });
        this.reportMetric('FID', firstInput.processingStart - firstInput.startTime);
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    }
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) { clsValue += entry.value; }
        }
        this.metrics.set('CLS', { value: clsValue, timestamp: Date.now() });
        this.reportMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    }
  }
  setupResourceTiming() {
    const observer = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.analyzeResourcePerformance(entry);
        }
      });
    });
    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }
  setupNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      this.metrics.set('Navigation', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart
      });
      this.reportNavigationMetrics(navigation);
    });
  }
  setupLayoutShiftTracking() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.value > 0.1) {
            console.warn('🚨 Significant layout shift detected:', {
              value: entry.value,
              sources: entry.sources?.map(source => ({
                element: source.node?.tagName || 'unknown',
                previousRect: source.previousRect,
                currentRect: source.currentRect
              }))
            });
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }
  setupLongTaskTracking() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.warn('⏱️ Long task detected:', { duration: entry.duration, startTime: entry.startTime, name: entry.name });
          this.reportLongTask(entry);
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }
  analyzeResourcePerformance(entry) {
    const timing = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      connection: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      total: entry.responseEnd - entry.startTime
    };
    if (timing.total > 1000) {
      console.warn('🐌 Slow resource detected:', { url: entry.name, timing, size: entry.transferSize });
    }
  }
  reportMetric(name, value) {
    let grade = 'good';
    switch (name) {
      case 'LCP': grade = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'; break;
      case 'FID': grade = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'; break;
      case 'CLS': grade = value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'; break;
    }
    console.log(`📊 ${name}: ${value.toFixed(2)}ms (${grade})`);
    if (window.gtag) {
      window.gtag('event', 'core_web_vital', { metric_name: name, metric_value: Math.round(value), metric_grade: grade });
    }
  }
  reportNavigationMetrics(navigation) {
    const metrics = {
      'Time to First Byte': navigation.responseStart - navigation.requestStart,
      'DOM Content Loaded': navigation.domContentLoadedEventEnd - navigation.navigationStart,
      'Load Complete': navigation.loadEventEnd - navigation.navigationStart,
      'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'TCP Connection': navigation.connectEnd - navigation.connectStart
    };
    console.log('🕒 Navigation Timing:', metrics);
  }
  reportLongTask(entry) {
    if (window.gtag) {
      window.gtag('event', 'long_task', { duration: Math.round(entry.duration), start_time: Math.round(entry.startTime) });
    }
  }
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      connection: navigator.connection ? { effectiveType: navigator.connection.effectiveType, downlink: navigator.connection.downlink, rtt: navigator.connection.rtt } : null,
      memory: performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null
    };
    return report;
  }
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.initialized = false;
  }
}
window.PerformanceMonitor = new PerformanceMonitor();
window.getPerformanceReport = () => window.PerformanceMonitor.generateReport();
})();

;(function(){
// ===== resource-preloader.js =====
class ResourcePreloader {
  constructor() {
    this.criticalResources = new Set();
    this.prefetchQueue = new Map();
    this.intersectionObserver = null;
    this.idleCallback = null;
    this.init();
  }
  init() {
    this.setupIntersectionObserver();
    this.preloadCriticalResources();
    this.setupIdlePreloading();
    this.optimizeImageLoading();
    console.log('🚀 Advanced resource preloader initialized');
  }
  preloadCriticalResources() {
    const criticalResources = [];
    criticalResources.forEach(resource => {
      if (!this.isResourceAlreadyLoaded(resource.url)) {
        this.preloadResource(resource);
        this.criticalResources.add(resource.url);
      }
    });
  }
  preloadResource(resource) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.media) link.media = resource.media;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
    console.log(`🔗 Preloaded: ${resource.url} (${resource.as})`);
  }
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { this.handleIntersection(entry.target); } });
    }, { rootMargin: '50px 0px 200px 0px', threshold: 0.01 });
    this.observeLazyElements();
  }
  observeLazyElements() {
    const projectCards = document.querySelectorAll('.project-card, [data-preload-on-visible]');
    projectCards.forEach(card => { this.intersectionObserver.observe(card); });
    const heavySections = document.querySelectorAll('.photo-carousel, .blog-section, .project-gallery');
    heavySections.forEach(section => { this.intersectionObserver.observe(section); });
  }
  handleIntersection(element) {
    const preloadUrls = element.dataset.preloadUrls;
    if (preloadUrls) {
      try { JSON.parse(preloadUrls).forEach(url => this.prefetchResource(url)); } catch (e) { console.warn('Invalid preload URLs data:', preloadUrls); }
    }
    const images = element.querySelectorAll('img[data-src], [data-bg-image]');
    images.forEach(img => this.preloadImage(img));
    this.intersectionObserver.unobserve(element);
  }
  setupIdlePreloading() {
    if ('requestIdleCallback' in window) {
      this.idleCallback = requestIdleCallback(() => { this.prefetchNextPageResources(); }, { timeout: 5000 });
    } else {
      setTimeout(() => this.prefetchNextPageResources(), 2000);
    }
  }
  prefetchNextPageResources() {
    const currentPath = window.location.pathname;
    let nextPages = [];
    if (currentPath === '/' || currentPath === '/index') {
      nextPages = ['/about', '/projects', '/blog'];
    } else if (currentPath === '/about') {
      nextPages = ['/projects', '/contact'];
    } else if (currentPath.startsWith('/projects')) {
      nextPages = ['/projects', '/about', '/contact'];
    } else if (currentPath.startsWith('/blog')) {
      nextPages = ['/blog', '/projects'];
    }
    nextPages.forEach(page => { this.prefetchPage(page); });
  }
  prefetchPage(path) {
    this.prefetchResource(path, 'document');
    this.getPageResources(path).forEach(resource => { this.prefetchResource(resource.url, resource.as); });
  }
  getPageResources(path) {
    const resources = [];
    switch (path) {
      case '/projects': resources.push({ url: '/api/projects.json', as: 'fetch' }); break;
      case '/blog': resources.push({ url: '/api/blog.json', as: 'fetch' }); break;
      case '/about': resources.push({ url: '/assets/images/Blake-O-scaled.jpg', as: 'image' }); break;
    }
    return resources;
  }
  prefetchResource(url, as = 'fetch') {
    if (this.prefetchQueue.has(url) || this.isResourceAlreadyLoaded(url)) { return; }
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) link.as = as;
    document.head.appendChild(link);
    this.prefetchQueue.set(url, Date.now());
    console.log(`⚡ Prefetched: ${url}`);
  }
  optimizeImageLoading() {
    const viewportWidth = window.innerWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;
    let optimalWidth = viewportWidth * devicePixelRatio;
    const breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920];
    optimalWidth = breakpoints.find(bp => bp >= optimalWidth) || 1920;
    console.log(`📱 Optimal image width: ${optimalWidth}px (viewport: ${viewportWidth}px, DPR: ${devicePixelRatio})`);
  }
  preloadImage(imgElement) {
    const src = imgElement.dataset.src || imgElement.src;
    if (!src || this.isResourceAlreadyLoaded(src)) return;
    if (this.supportsAVIF()) {
      const avifSrc = src.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif');
      this.preloadResource({ url: avifSrc, as: 'image', type: 'image/avif' });
    } else if (this.supportsWebP()) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      this.preloadResource({ url: webpSrc, as: 'image', type: 'image/webp' });
    } else {
      this.preloadResource({ url: src, as: 'image' });
    }
  }
  isResourceAlreadyLoaded(url) {
    const existingLinks = document.querySelectorAll(`link[href="${url}"], script[src="${url}"]`);
    return existingLinks.length > 0;
  }
  supportsAVIF() {
    if (typeof this._avifSupport !== 'undefined') return this._avifSupport;
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    this._avifSupport = canvas.toDataURL('image/avif').startsWith('data:image/avif');
    return this._avifSupport;
  }
  supportsWebP() {
    if (typeof this._webpSupport !== 'undefined') return this._webpSupport;
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    this._webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    return this._webpSupport;
  }
  getStats() {
    return {
      criticalResourcesLoaded: this.criticalResources.size,
      prefetchedResources: this.prefetchQueue.size,
      avifSupported: this.supportsAVIF(),
      webpSupported: this.supportsWebP(),
      viewportWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }
  destroy() {
    if (this.intersectionObserver) { this.intersectionObserver.disconnect(); }
    if (this.idleCallback) { cancelIdleCallback(this.idleCallback); }
  }
}
window.ResourcePreloader = new ResourcePreloader();
window.preloadResource = (url, as) => window.ResourcePreloader.prefetchResource(url, as);
window.getPreloadStats = () => window.ResourcePreloader.getStats();
})();

;(function(){
// ===== pwa-enhancer.js =====
class PWAEnhancer {
  constructor() {
    this.installPrompt = null;
    this.isInstalled = false;
    this.updateAvailable = false;
    this.init();
  }
  init() {
    this.isTestEnvironment = typeof window !== 'undefined' && (window.navigator.webdriver || window.playwright || (window.location && window.location.protocol === 'http:'));
    this.checkInstallStatus();
    this.setupInstallPrompt();
    this.setupUpdateDetection();
    this.setupOfflineIndicator();
    this.setupPushNotifications();
    this.setupBackgroundSync();
    console.log('📱 PWA Enhancement initialized', this.isTestEnvironment ? '(Test Mode)' : '');
  }
  checkInstallStatus() {
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (this.isInstalled) { console.log('📱 App is running in standalone mode'); this.hideInstallUI(); }
  }
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => { console.log('📱 Install prompt available'); e.preventDefault(); this.installPrompt = e; this.showInstallUI(); });
    window.addEventListener('appinstalled', () => { console.log('✅ PWA installed successfully'); this.isInstalled = true; this.hideInstallUI(); this.trackInstallation(); });
  }
  showInstallUI() {
    let installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) { installBtn = this.createInstallButton(); document.body.appendChild(installBtn); }
    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', () => this.promptInstall());
  }
  createInstallButton() {
    const button = document.createElement('div');
    button.id = 'pwa-install-btn';
    button.innerHTML = `
      <div class="pwa-install-container">
        <div class="pwa-install-content">
          <div class="pwa-install-icon">📱</div>
          <div class="pwa-install-text">
            <div class="pwa-install-title">Install App</div>
            <div class="pwa-install-subtitle">Get the full experience</div>
          </div>
          <button class="pwa-install-action" aria-label="Install PWA">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button class="pwa-install-close" aria-label="Close install prompt">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); color: white; max-width: 300px; animation: slideInUp 0.3s ease-out; }
      .pwa-install-content { display: flex; align-items: center; padding: 16px; gap: 12px; }
      .pwa-install-icon { font-size: 24px; flex-shrink: 0; }
      .pwa-install-text { flex: 1; }
      .pwa-install-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
      .pwa-install-subtitle { font-size: 12px; opacity: 0.9; }
      .pwa-install-action, .pwa-install-close { background: rgba(255,255,255,0.2); border: none; border-radius: 8px; color: white; cursor: pointer; padding: 8px; transition: background 0.2s ease; flex-shrink: 0; }
      .pwa-install-action:hover, .pwa-install-close:hover { background: rgba(255,255,255,0.3); }
      .pwa-install-close { margin-left: 4px; }
      @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
    button.querySelector('.pwa-install-close').addEventListener('click', (e) => { e.stopPropagation(); this.hideInstallUI(); });
    return button;
  }
  async promptInstall() {
    if (!this.installPrompt) return;
    try {
      const result = await this.installPrompt.prompt();
      console.log('📱 Install prompt result:', result.outcome);
      if (result.outcome === 'accepted') { this.trackInstallation('accepted'); } else { this.trackInstallation('declined'); }
      this.installPrompt = null; this.hideInstallUI();
    } catch (error) { console.error('Install prompt error:', error); }
  }
  hideInstallUI() { const installBtn = document.getElementById('pwa-install-btn'); if (installBtn) { installBtn.style.display = 'none'; } }
  setupUpdateDetection() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => { console.log('🔄 Service worker updated'); this.showUpdateNotification(); });
      const checkInterval = this.isTestEnvironment ? 300000 : 60000;
      setInterval(() => { this.checkForUpdates(); }, checkInterval);
    }
  }
  async checkForUpdates() { if ('serviceWorker' in navigator) { const registration = await navigator.serviceWorker.getRegistration(); if (registration) { registration.update(); } } }
  showUpdateNotification() {
    if (this.isTestEnvironment) { console.log('📱 PWA update available (suppressed in test mode)'); return; }
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div class="pwa-update-notification">
        <div class="pwa-update-content">
          <div class="pwa-update-icon">🔄</div>
          <div class="pwa-update-text">
            <div class="pwa-update-title">Update Available</div>
            <div class="pwa-update-subtitle">Refresh to get the latest version</div>
          </div>
          <button class="pwa-update-action" onclick="window.location.reload()"> Refresh </button>
        </div>
      </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
      .pwa-update-notification { position: fixed; top: 20px; right: 20px; z-index: 1001; background: var(--color-accent); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); color: white; max-width: 300px; animation: slideInDown 0.3s ease-out; pointer-events: auto; }
      .pwa-update-content { display: flex; align-items: center; padding: 16px; gap: 12px; }
      .pwa-update-icon { font-size: 24px; flex-shrink: 0; }
      .pwa-update-text { flex: 1; }
      .pwa-update-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
      .pwa-update-subtitle { font-size: 12px; }
      .pwa-update-action { background: #ffffff; color: #111827; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; cursor: pointer; padding: 8px 16px; font-size: 12px; font-weight: 700; transition: background 0.2s ease, box-shadow 0.2s ease; }
      .pwa-update-action:hover { background: #f3f4f6; }
      .pwa-update-action:focus-visible { outline: 2px solid #111827; outline-offset: 2px; box-shadow: 0 0 0 2px rgba(255,255,255,0.9); }
      @keyframes slideInDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    try {
      const root = notification.querySelector('.pwa-update-notification');
      const getRGB = (str) => { const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : [17, 24, 39]; };
      const luminance = (r, g, b) => { const srgb = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]; };
      const bg = getComputedStyle(root).backgroundColor; const [r, g, b] = getRGB(bg); const L = luminance(r, g, b); const highContrast = L > 0.5 ? '#111827' : '#ffffff';
      const titleEl = notification.querySelector('.pwa-update-title'); const subtitleEl = notification.querySelector('.pwa-update-subtitle'); const iconEl = notification.querySelector('.pwa-update-icon'); const contentEl = notification.querySelector('.pwa-update-content');
      if (titleEl) titleEl.style.color = highContrast; if (subtitleEl) subtitleEl.style.color = highContrast; if (iconEl) iconEl.style.color = highContrast; if (contentEl) { contentEl.style.background = highContrast === '#ffffff' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'; contentEl.style.borderRadius = '12px'; }
    } catch (e) { }
    setTimeout(() => { notification.remove(); }, 10000);
  }
  setupOfflineIndicator() { window.addEventListener('online', () => { this.showConnectionStatus('online'); }); window.addEventListener('offline', () => { this.showConnectionStatus('offline'); }); }
  showConnectionStatus(status) {
    const indicator = document.createElement('div');
    indicator.className = `pwa-connection-indicator pwa-connection-${status}`;
    indicator.innerHTML = `
      <div class="pwa-connection-content">
        <div class="pwa-connection-icon">${status === 'online' ? '🟢' : '🔴'}</div>
        <div class="pwa-connection-text"> ${status === 'online' ? 'Back online' : 'You\'re offline'} </div>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `
      .pwa-connection-indicator { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1002; border-radius: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); color: white; animation: slideInDown 0.3s ease-out; }
      .pwa-connection-online { background: #10b981; }
      .pwa-connection-offline { background: #ef4444; }
      .pwa-connection-content { display: flex; align-items: center; padding: 8px 16px; gap: 8px; }
      .pwa-connection-icon { font-size: 12px; }
      .pwa-connection-text { font-size: 12px; font-weight: 600; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    setTimeout(() => { indicator.remove(); }, 3000);
  }
  setupPushNotifications() { if ('Notification' in window && 'serviceWorker' in navigator) { document.addEventListener('click', this.requestNotificationPermission, { once: true }); } }
  async requestNotificationPermission() { if (Notification.permission === 'default') { const permission = await Notification.requestPermission(); console.log('📢 Notification permission:', permission); if (permission === 'granted') { this.subscribeToNotifications(); } } }
  async subscribeToNotifications() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.urlBase64ToUint8Array('your-vapid-public-key') });
        console.log('📢 Push subscription created:', subscription);
        this.sendSubscriptionToServer(subscription);
      }
    } catch (error) { console.error('Push subscription failed:', error); }
  }
  setupBackgroundSync() { if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) { console.log('🔄 Background sync supported'); this.setupFormSync(); } }
  setupFormSync() {
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (form.dataset.sync === 'true') {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        await this.storeForSync('form-submission', data);
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) { registration.sync.register('form-submission'); }
        this.showSyncNotification();
      }
    });
  }
  async storeForSync(type, data) { const syncData = JSON.parse(localStorage.getItem('pwa-sync-data') || '[]'); syncData.push({ type, data, timestamp: Date.now(), id: Date.now().toString() }); localStorage.setItem('pwa-sync-data', JSON.stringify(syncData)); }
  showSyncNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div class="pwa-sync-notification">
        <div class="pwa-sync-content">
          <div class="pwa-sync-icon">⏳</div>
          <div class="pwa-sync-text">
            <div class="pwa-sync-title">Queued for Sync</div>
            <div class="pwa-sync-subtitle">Will send when online</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3000);
  }
  trackInstallation(outcome = 'completed') { if (window.gtag) { window.gtag('event', 'pwa_install', { outcome: outcome, device_type: this.getDeviceType(), user_agent: navigator.userAgent }); } }
  getDeviceType() { const width = window.innerWidth; if (width < 768) return 'mobile'; if (width < 1024) return 'tablet'; return 'desktop'; }
  urlBase64ToUint8Array(base64String) { const padding = '='.repeat((4 - base64String.length % 4) % 4); const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/'); const rawData = window.atob(base64); const outputArray = new Uint8Array(rawData.length); for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); } return outputArray; }
  async sendSubscriptionToServer(subscription) { console.log('📤 Would send subscription to server:', subscription); }
  getStatus() { return { isInstalled: this.isInstalled, hasInstallPrompt: !!this.installPrompt, notificationPermission: Notification?.permission || 'unsupported', isOnline: navigator.onLine, supportsSync: 'sync' in window.ServiceWorkerRegistration.prototype }; }
}
window.PWAEnhancer = new PWAEnhancer();
})();
