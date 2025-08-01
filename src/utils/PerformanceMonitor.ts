/**
 * Performance Monitoring for Bundle Optimization
 * Tracks and reports on the effectiveness of dynamic loading and bundle optimization
 */

import { getDynamicModuleLoader } from './DynamicModuleLoader';
import { getFeatureBundleManager } from './FeatureBundleManager';
import { getPerformanceObserverManager } from './PerformanceObserverManager';

export interface PerformanceMetrics {
  // Loading metrics
  totalBundleLoadTime: number;
  averageModuleLoadTime: number;
  bundlesLoaded: number;
  modulesLoaded: number;
  
  // Size metrics
  estimatedBundleSize: number;
  actualLoadedSize: number;
  sizeSavings: number;
  
  // Timing metrics
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  criticalResourceLoadTime: number;
  
  // User experience metrics
  interactionToResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface OptimizationReport {
  timestamp: string;
  pageUrl: string;
  metrics: PerformanceMetrics;
  bundleBreakdown: Array<{
    bundleName: string;
    loadTime: number;
    moduleCount: number;
    success: boolean;
  }>;
  recommendations: string[];
}

export class PerformanceMonitor {
  private startTime = 0;
  private loadMetrics = new Map<string, number>();
  private bundleMetrics = new Map<string, number>();
  private errorCount = 0;
  private isMonitoring = false;
  private observerManager = getPerformanceObserverManager();
  private observerSubscriptions: string[] = [];
  private interactionStartTimes = new Map<string, number>();
  private totalRequests = 0;
  private cacheHits = 0;

  constructor() {
    this.setupPerformanceObserver();
  }

    /**
   * Setup Performance Observer using consolidated observer manager
   */
  private setupPerformanceObserver(): void {
    if (!this.observerManager.isAvailable()) {
      console.warn('PerformanceObserver not available in this environment');
      return;
    }

    try {
      // Subscribe to paint metrics
      const paintSubscription = this.observerManager.subscribe(
        ['paint'],
        (entries) => {
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.loadMetrics.set('fcp', entry.startTime);
            }
          });
        },
        'PerformanceMonitor',
        { buffered: true }
      );

      // Subscribe to navigation metrics
      const navigationSubscription = this.observerManager.subscribe(
        ['navigation'],
        (entries) => {
          entries.forEach((entry) => {
            if ('loadEventEnd' in entry) {
              this.loadMetrics.set('loadComplete', (entry as PerformanceNavigationTiming).loadEventEnd);
            }
          });
        },
        'PerformanceMonitor'
      );

      // Subscribe to resource metrics
      const resourceSubscription = this.observerManager.subscribe(
        ['resource'],
        (entries) => {
          entries.forEach((entry) => {
            this.trackResourceLoad(entry as PerformanceResourceTiming);
          });
        },
        'PerformanceMonitor'
      );

      // Track subscriptions for cleanup
      this.observerSubscriptions.push(paintSubscription, navigationSubscription, resourceSubscription);

    } catch (error) {
      console.warn('Failed to setup performance monitoring:', error);
    }
  }

  /**
   * Track resource loading performance
   */
  private trackResourceLoad(entry: PerformanceResourceTiming): void {
    this.totalRequests++;
    
    const resourceName = entry.name.split('/').pop() || entry.name;
    this.loadMetrics.set(`resource-${resourceName}`, entry.duration);
    
    // Check for cached resources
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
      this.cacheHits++;
    }

    // Track bundle-specific resources
    if (entry.name.includes('bundle') || entry.name.includes('.js')) {
      this.bundleMetrics.set(resourceName, entry.duration);
    }
  }

  /**
   * Track user interactions for response time measurement
   */
  private trackUserInteractions(): void {
    if (typeof document === 'undefined') return;

    const interactionEvents = ['click', 'keydown', 'touchstart'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        const interactionId = `${eventType}-${Date.now()}`;
        this.interactionStartTimes.set(interactionId, performance.now());

        // Clean up old interaction times (keep only last 10)
        if (this.interactionStartTimes.size > 10) {
          const keys = Array.from(this.interactionStartTimes.keys());
          const oldestKey = keys[0];
          if (oldestKey) {
            this.interactionStartTimes.delete(oldestKey);
          }
        }
      });
    });
  }

  /**
   * Record bundle load completion
   */
  recordBundleLoad(bundleName: string, loadTime: number, success: boolean): void {
    this.loadMetrics.set(`bundle-${bundleName}`, loadTime);
    this.totalRequests++;
    
    if (!success) {
      this.errorCount++;
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    this.totalRequests++;
    if (hit) {
      this.cacheHits++;
    }
  }

  /**
   * Calculate current performance metrics
   */
  calculateMetrics(): PerformanceMetrics {
    const dynamicLoader = getDynamicModuleLoader();
    const bundleManager = getFeatureBundleManager();
    
    const loaderStats = dynamicLoader.getLoadingStats();
    const bundleStats = bundleManager.getBundleStats();

    // Calculate timing metrics
    const totalBundleLoadTime = Array.from(this.loadMetrics.entries())
      .filter(([key]) => key.startsWith('bundle-'))
      .reduce((sum, [, time]) => sum + time, 0);

    const averageModuleLoadTime = loaderStats.totalLoadTime / Math.max(loaderStats.loadedCount, 1);

    // Calculate interaction response time
    const recentInteractionTimes = Array.from(this.interactionStartTimes.values());
    const averageInteractionTime = recentInteractionTimes.length > 0
      ? recentInteractionTimes.reduce((sum, time) => sum + (performance.now() - time), 0) / recentInteractionTimes.length
      : 0;

    // Calculate size savings
    const sizeSavings = bundleStats.totalEstimatedSize - bundleStats.loadedSize;

    // Calculate cache hit rate
    const cacheHitRate = this.totalRequests > 0 ? (this.cacheHits / this.totalRequests) * 100 : 0;

    // Calculate error rate
    const errorRate = this.totalRequests > 0 ? (this.errorCount / this.totalRequests) * 100 : 0;

    return {
      totalBundleLoadTime,
      averageModuleLoadTime,
      bundlesLoaded: bundleStats.loadedBundles,
      modulesLoaded: loaderStats.loadedCount,
      estimatedBundleSize: bundleStats.totalEstimatedSize,
      actualLoadedSize: bundleStats.loadedSize,
      sizeSavings,
      firstContentfulPaint: this.loadMetrics.get('fcp'),
      timeToInteractive: this.loadMetrics.get('loadComplete'),
      criticalResourceLoadTime: this.loadMetrics.get('bundle-core') || 0,
      interactionToResponseTime: averageInteractionTime,
      cacheHitRate,
      errorRate
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2500) {
      recommendations.push('Consider preloading critical CSS and reducing render-blocking resources');
    }

    if (metrics.averageModuleLoadTime > 500) {
      recommendations.push('Module loading is slow - consider CDN optimization or module size reduction');
    }

    if (metrics.errorRate > 5) {
      recommendations.push(`High error rate (${metrics.errorRate.toFixed(1)}%) - investigate failed module loads`);
    }

    if (metrics.cacheHitRate < 80) {
      recommendations.push(`Low cache hit rate (${metrics.cacheHitRate.toFixed(1)}%) - optimize caching strategy`);
    }

    // Bundle optimization recommendations
    if (metrics.sizeSavings < 20000) {
      recommendations.push('Low bundle size savings - consider more aggressive code splitting');
    }

    if (metrics.interactionToResponseTime > 100) {
      recommendations.push('Slow interaction response time - consider preloading interactive features');
    }

    // Success messages
    if (recommendations.length === 0) {
      recommendations.push('🎉 All performance metrics are within optimal ranges!');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive optimization report
   */
  generateOptimizationReport(): OptimizationReport {
    const metrics = this.calculateMetrics();
    const recommendations = this.generateRecommendations(metrics);
    
    const bundleManager = getFeatureBundleManager();
    const bundleStats = bundleManager.getBundleStats();
    
    const bundleBreakdown = bundleStats.bundleDetails.map(bundle => ({
      bundleName: bundle.name,
      loadTime: this.loadMetrics.get(`bundle-${bundle.name}`) || 0,
      moduleCount: bundle.moduleCount,
      success: bundle.loaded
    }));

    return {
      timestamp: new Date().toISOString(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
      metrics,
      bundleBreakdown,
      recommendations
    };
  }

  /**
   * Log performance report to console
   */
  logPerformanceReport(): void {
    const report = this.generateOptimizationReport();
    
    console.group('📊 Bundle Optimization Performance Report');
    console.log('🕐 Timestamp:', report.timestamp);
    console.log('🌐 Page:', report.pageUrl);
    
    console.group('📈 Metrics');
    console.log(`⚡ Total Bundle Load Time: ${report.metrics.totalBundleLoadTime.toFixed(2)}ms`);
    console.log(`🔄 Average Module Load Time: ${report.metrics.averageModuleLoadTime.toFixed(2)}ms`);
    console.log(`📦 Bundles Loaded: ${report.metrics.bundlesLoaded}`);
    console.log(`🧩 Modules Loaded: ${report.metrics.modulesLoaded}`);
    console.log(`💾 Size Savings: ${(report.metrics.sizeSavings / 1024).toFixed(2)} KB`);
    console.log(`🎯 Cache Hit Rate: ${report.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`❌ Error Rate: ${report.metrics.errorRate.toFixed(1)}%`);
    console.groupEnd();

    if (report.bundleBreakdown.length > 0) {
      console.group('📋 Bundle Breakdown');
      report.bundleBreakdown.forEach(bundle => {
        const status = bundle.success ? '✅' : '❌';
        console.log(`${status} ${bundle.bundleName}: ${bundle.loadTime.toFixed(2)}ms (${bundle.moduleCount} modules)`);
      });
      console.groupEnd();
    }

    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations');
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Export performance data for analytics
   */
  exportPerformanceData(): string {
    const report = this.generateOptimizationReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Start monitoring session
   */
  startMonitoring(): void {
    this.startTime = performance.now();
    console.log('🔍 Performance monitoring started');

    // Log report after 5 seconds
    setTimeout(() => this.logPerformanceReport(), 5000);

    // Log periodic updates every 30 seconds
    setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        this.logPerformanceReport();
      }
    }, 30000);
  }
}

// Global instance management
let globalMonitor: PerformanceMonitor;

export function initPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
    
    if (typeof window !== 'undefined') {
      (window as any).performanceMonitor = globalMonitor;
    }
  }
  
  return globalMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor {
  return globalMonitor || initPerformanceMonitor();
}

// Auto-initialize and start monitoring
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const monitor = initPerformanceMonitor();
      monitor.startMonitoring();
    });
  } else {
    const monitor = initPerformanceMonitor();
    monitor.startMonitoring();
  }
}
