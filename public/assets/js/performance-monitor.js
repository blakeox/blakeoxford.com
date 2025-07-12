/**
 * Core Web Vitals Monitoring & Performance Tracking
 * Real-time performance metrics collection and reporting
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.initialized = false;
    
    // Initialize monitoring when DOM is ready
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

  // Core Web Vitals tracking
  setupCoreWebVitals() {
    // Largest Contentful Paint (LCP)
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

    // First Input Delay (FID)
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

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        this.metrics.set('CLS', {
          value: clsValue,
          timestamp: Date.now()
        });
        
        this.reportMetric('CLS', clsValue);
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    }
  }

  // Resource timing analysis
  setupResourceTiming() {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach(entry => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.analyzeResourcePerformance(entry);
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  // Navigation timing
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

  // Layout shift tracking with element details
  setupLayoutShiftTracking() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.value > 0.1) { // Significant layout shift
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

  // Long task detection
  setupLongTaskTracking() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.warn('⏱️ Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
          
          // Track long tasks for performance budgets
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

    // Flag slow resources
    if (timing.total > 1000) { // > 1 second
      console.warn('🐌 Slow resource detected:', {
        url: entry.name,
        timing,
        size: entry.transferSize
      });
    }
  }

  reportMetric(name, value) {
    // Grade metrics according to Core Web Vitals thresholds
    let grade = 'good';
    
    switch (name) {
      case 'LCP':
        grade = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
        break;
      case 'FID':
        grade = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
        break;
      case 'CLS':
        grade = value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
        break;
    }

    console.log(`📊 ${name}: ${value.toFixed(2)}ms (${grade})`);
    
    // Send to analytics if configured
    if (window.gtag) {
      window.gtag('event', 'core_web_vital', {
        metric_name: name,
        metric_value: Math.round(value),
        metric_grade: grade
      });
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
      window.gtag('event', 'long_task', {
        duration: Math.round(entry.duration),
        start_time: Math.round(entry.startTime)
      });
    }
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };

    return report;
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.initialized = false;
  }
}

// Initialize performance monitoring
window.PerformanceMonitor = new PerformanceMonitor();

// Export report function for manual reporting
window.getPerformanceReport = () => window.PerformanceMonitor.generateReport();
