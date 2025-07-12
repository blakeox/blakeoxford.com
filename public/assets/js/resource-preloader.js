/**
 * Advanced Resource Preloading & Critical Path Optimization
 * Intelligent resource prioritization and loading strategies
 */

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

  // Preload critical above-the-fold resources
  preloadCriticalResources() {
    const criticalResources = [
      // Hero images
      { url: '/assets/images/hero-bg-320.avif', as: 'image', type: 'image/avif', media: '(max-width: 640px)' },
      { url: '/assets/images/hero-bg-768.avif', as: 'image', type: 'image/avif', media: '(min-width: 641px) and (max-width: 1024px)' },
      { url: '/assets/images/hero-bg-1920.avif', as: 'image', type: 'image/avif', media: '(min-width: 1025px)' },
      
      // WebP fallbacks
      { url: '/assets/images/hero-bg-320.webp', as: 'image', type: 'image/webp', media: '(max-width: 640px)' },
      { url: '/assets/images/hero-bg-768.webp', as: 'image', type: 'image/webp', media: '(min-width: 641px) and (max-width: 1024px)' },
      { url: '/assets/images/hero-bg-1920.webp', as: 'image', type: 'image/webp', media: '(min-width: 1025px)' },
      
      // Critical CSS is already inlined, but preload the full stylesheet
      { url: '/assets/css/main.css', as: 'style' },
      
      // Essential JavaScript
      { url: '/assets/js/main.js', as: 'script' },
      { url: '/assets/js/theme-toggle.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      if (!this.isResourceAlreadyLoaded(resource.url)) {
        this.preloadResource(resource);
        this.criticalResources.add(resource.url);
      }
    });
  }

  // Create preload link with advanced attributes
  preloadResource(resource) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.as;
    
    if (resource.type) link.type = resource.type;
    if (resource.media) link.media = resource.media;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    
    // Add to head immediately for critical resources
    document.head.appendChild(link);
    
    console.log(`🔗 Preloaded: ${resource.url} (${resource.as})`);
  }

  // Set up intersection observer for lazy preloading
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.handleIntersection(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px 200px 0px', // Start loading 200px before entering viewport
      threshold: 0.01
    });

    // Observe elements that need lazy preloading
    this.observeLazyElements();
  }

  // Observe elements for lazy loading
  observeLazyElements() {
    // Observe project cards for lazy loading
    const projectCards = document.querySelectorAll('.project-card, [data-preload-on-visible]');
    projectCards.forEach(card => {
      this.intersectionObserver.observe(card);
    });

    // Observe sections that might contain heavy content
    const heavySections = document.querySelectorAll('.photo-carousel, .blog-section, .project-gallery');
    heavySections.forEach(section => {
      this.intersectionObserver.observe(section);
    });
  }

  // Handle element intersection
  handleIntersection(element) {
    const preloadUrls = element.dataset.preloadUrls;
    if (preloadUrls) {
      try {
        const urls = JSON.parse(preloadUrls);
        urls.forEach(url => this.prefetchResource(url));
      } catch (e) {
        console.warn('Invalid preload URLs data:', preloadUrls);
      }
    }

    // Preload images within the element
    const images = element.querySelectorAll('img[data-src], [data-bg-image]');
    images.forEach(img => this.preloadImage(img));

    // Stop observing this element
    this.intersectionObserver.unobserve(element);
  }

  // Prefetch resources during idle time
  setupIdlePreloading() {
    if ('requestIdleCallback' in window) {
      this.idleCallback = requestIdleCallback(() => {
        this.prefetchNextPageResources();
      }, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.prefetchNextPageResources(), 2000);
    }
  }

  // Prefetch resources for likely next pages
  prefetchNextPageResources() {
    const currentPath = window.location.pathname;
    let nextPages = [];

    // Predict next pages based on current location
    if (currentPath === '/' || currentPath === '/index') {
      nextPages = ['/about', '/projects', '/blog'];
    } else if (currentPath === '/about') {
      nextPages = ['/projects', '/contact'];
    } else if (currentPath.startsWith('/projects')) {
      nextPages = ['/projects', '/about', '/contact'];
    } else if (currentPath.startsWith('/blog')) {
      nextPages = ['/blog', '/projects'];
    }

    // Prefetch critical resources for next pages
    nextPages.forEach(page => {
      this.prefetchPage(page);
    });
  }

  // Prefetch resources for a specific page
  prefetchPage(path) {
    // Prefetch the HTML
    this.prefetchResource(path, 'document');

    // Prefetch page-specific resources
    const pageResources = this.getPageResources(path);
    pageResources.forEach(resource => {
      this.prefetchResource(resource.url, resource.as);
    });
  }

  // Get resources specific to a page
  getPageResources(path) {
    const resources = [];

    switch (path) {
      case '/projects':
        resources.push(
          { url: '/api/projects.json', as: 'fetch' },
          { url: '/assets/images/project-placeholder-640.avif', as: 'image' }
        );
        break;
      case '/blog':
        resources.push(
          { url: '/api/blog.json', as: 'fetch' },
          { url: '/assets/images/blog-placeholder-640.avif', as: 'image' }
        );
        break;
      case '/about':
        resources.push(
          { url: '/assets/images/profile-640.avif', as: 'image' },
          { url: '/assets/Resume.pdf', as: 'document' }
        );
        break;
    }

    return resources;
  }

  // Prefetch a resource
  prefetchResource(url, as = 'fetch') {
    if (this.prefetchQueue.has(url) || this.isResourceAlreadyLoaded(url)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) link.as = as;

    document.head.appendChild(link);
    this.prefetchQueue.set(url, Date.now());

    console.log(`⚡ Prefetched: ${url}`);
  }

  // Optimize image loading with responsive preloading
  optimizeImageLoading() {
    // Preload responsive images based on viewport
    const viewportWidth = window.innerWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Calculate optimal image size
    let optimalWidth = viewportWidth * devicePixelRatio;
    
    // Round up to next breakpoint for better caching
    const breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920];
    optimalWidth = breakpoints.find(bp => bp >= optimalWidth) || 1920;

    console.log(`📱 Optimal image width: ${optimalWidth}px (viewport: ${viewportWidth}px, DPR: ${devicePixelRatio})`);
  }

  // Preload a specific image with format detection
  preloadImage(imgElement) {
    const src = imgElement.dataset.src || imgElement.src;
    if (!src || this.isResourceAlreadyLoaded(src)) return;

    // Check for modern format support
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

  // Check if resource is already loaded
  isResourceAlreadyLoaded(url) {
    // Check if already in DOM
    const existingLinks = document.querySelectorAll(`link[href="${url}"], script[src="${url}"]`);
    return existingLinks.length > 0;
  }

  // Feature detection for modern image formats
  supportsAVIF() {
    if (typeof this._avifSupport !== 'undefined') return this._avifSupport;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this._avifSupport = canvas.toDataURL('image/avif').startsWith('data:image/avif');
    return this._avifSupport;
  }

  supportsWebP() {
    if (typeof this._webpSupport !== 'undefined') return this._webpSupport;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this._webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    return this._webpSupport;
  }

  // Get preloading statistics
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

  // Cleanup
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback);
    }
  }
}

// Initialize resource preloader
window.ResourcePreloader = new ResourcePreloader();

// Export for manual control
window.preloadResource = (url, as) => window.ResourcePreloader.prefetchResource(url, as);
window.getPreloadStats = () => window.ResourcePreloader.getStats();
