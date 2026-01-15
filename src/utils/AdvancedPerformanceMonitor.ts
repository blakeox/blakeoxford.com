/**
 * Advanced Performance Monitor - Enhanced Runtime Performance Monitoring
 * Extends the existing PerformanceMonitor with advanced monitoring capabilities
 */

import { getPerformanceMonitor } from './PerformanceMonitor';

export interface AdvancedPerformanceMetrics {
  // Memory metrics
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };

  // Network metrics
  networkTiming: {
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };

  // User experience metrics
  userEngagement: {
    sessionDuration: number;
    pageViews: number;
    interactions: number;
    scrollDepth: number;
    bounceRate: number;
  };

  // Performance budget compliance
  budgetCompliance: {
    totalScore: number;
    categoryScores: {
      loading: number;
      interactivity: number;
      visualStability: number;
      accessibility: number;
    };
  };

  // Resource efficiency
  resourceEfficiency: {
    unusedCSS: number;
    unusedJS: number;
    totalResources: number;
    compressedResources: number;
    cachedResources: number;
  };

  // Real User Monitoring (RUM)
  realUserMetrics: {
    averageLoadTime: number;
    p95LoadTime: number;
    errorRate: number;
    conversionRate: number;
  };
}

export interface PerformanceAlert {
  type: 'memory_leak' | 'slow_interaction' | 'large_layout_shift' | 'budget_exceeded' | 'error_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  recommendation: string;
}

export interface PerformanceBudget {
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
    speedIndex: number;
  };
  resources: {
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
    fontSize: number;
  };
  enabled: boolean;
}

export interface AdvancedPerformanceConfig {
  enabled: boolean;
  samplingRate: number; // 0-1, percentage of sessions to monitor
  alertThresholds: {
    memoryUsage: number; // MB
    interactionDelay: number; // ms
    layoutShiftScore: number;
    errorRate: number; // percentage
  };
  budget: PerformanceBudget;
  realUserMonitoring: boolean;
  automaticReporting: boolean;
  debugMode: boolean;
}

export class AdvancedPerformanceMonitor {
  private static instance: AdvancedPerformanceMonitor;
  private config: AdvancedPerformanceConfig;
  private baseMonitor = getPerformanceMonitor();
  private alerts: PerformanceAlert[] = [];
  private userMetrics = new Map<string, number[]>();
  private sessionStartTime = performance.now();
  private pageViews = 0;
  private interactions = 0;
  private maxScrollDepth = 0;
  // Note: memoryObserver was not used; remove to keep class minimal

  private constructor(config?: Partial<AdvancedPerformanceConfig>) {
    this.config = {
      enabled: true,
      samplingRate: 0.1, // Monitor 10% of sessions by default
      alertThresholds: {
        memoryUsage: 100, // 100MB
        interactionDelay: 200, // 200ms
        layoutShiftScore: 0.1,
        errorRate: 5 // 5%
      },
      budget: {
        metrics: {
          firstContentfulPaint: 1800,
          largestContentfulPaint: 2500,
          firstInputDelay: 100,
          cumulativeLayoutShift: 0.1,
          totalBlockingTime: 200,
          speedIndex: 3000
        },
        resources: {
          totalSize: 512000, // 512KB
          jsSize: 200000, // 200KB
          cssSize: 50000, // 50KB
          imageSize: 200000, // 200KB
          fontSize: 50000 // 50KB
        },
        enabled: true
      },
      realUserMonitoring: true,
      automaticReporting: false,
      debugMode: true,
      ...config
    };

    if (typeof window !== 'undefined' && this.config.enabled) {
      // Only monitor a percentage of sessions to reduce overhead
      if (Math.random() <= this.config.samplingRate || this.config.debugMode) {
        this.initializeAdvancedMonitoring();
      }
    }
  }

  static getInstance(config?: Partial<AdvancedPerformanceConfig>): AdvancedPerformanceMonitor {
    if (!AdvancedPerformanceMonitor.instance) {
      AdvancedPerformanceMonitor.instance = new AdvancedPerformanceMonitor(config);
    }
    return AdvancedPerformanceMonitor.instance;
  }

  /**
   * Initialize advanced performance monitoring
   */
  private initializeAdvancedMonitoring(): void {
    this.setupMemoryMonitoring();
    this.setupUserEngagementTracking();
    this.setupBudgetMonitoring();
    this.setupRealUserMonitoring();
    this.setupPerformanceAlerts();

    if (this.config.debugMode) {
      console.log('📈 Advanced performance monitoring initialized');
    }
  }

  /**
   * Setup memory usage monitoring
   */
  private setupMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB

      if (memoryUsage > this.config.alertThresholds.memoryUsage) {
        this.createAlert({
          type: 'memory_leak',
          severity: 'high',
          timestamp: Date.now(),
          metric: 'memory_usage',
          value: memoryUsage,
          threshold: this.config.alertThresholds.memoryUsage,
          message: `High memory usage detected: ${memoryUsage.toFixed(2)}MB`,
          recommendation: 'Check for memory leaks in JavaScript code or large objects in memory'
        });
      }
    }, 30000);
  }

  /**
   * Setup user engagement tracking
   */
  private setupUserEngagementTracking(): void {
    // Track page views
    this.pageViews++;

    // Track interactions
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.interactions++;
      }, { passive: true });
    });

    // Track scroll depth
    let maxScroll = 0;
    document.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        this.maxScrollDepth = Math.min(100, Math.max(0, scrollPercent));
      }
    }, { passive: true });

    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      const sessionDuration = performance.now() - this.sessionStartTime;
      this.recordUserMetric('sessionDuration', sessionDuration);
    });
  }

  /**
   * Setup performance budget monitoring
   */
  private setupBudgetMonitoring(): void {
    if (!this.config.budget.enabled) return;

    // Monitor Core Web Vitals against budget
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.checkBudgetCompliance(entry);
        });
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    }

    // Monitor resource sizes
    window.addEventListener('load', () => {
      setTimeout(() => this.checkResourceBudget(), 1000);
    });
  }

  /**
   * Setup Real User Monitoring (RUM)
   */
  private setupRealUserMonitoring(): void {
    if (!this.config.realUserMonitoring) return;

    // Collect real user metrics
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.recordUserMetric('loadTime', loadTime);
      }
    });

    // Track errors
    window.addEventListener('error', () => {
      this.recordUserMetric('errors', 1);
    });

    // Track conversions (customize based on your conversion events)
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form && form.id === 'contact-form') {
        this.recordUserMetric('conversions', 1);
      }
    });
  }

  /**
   * Setup performance alerts
   */
  private setupPerformanceAlerts(): void {
    // Monitor for slow interactions
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const firstInputEntry = entry as any; // PerformanceEventTiming
          if (entry.name === 'first-input' && firstInputEntry.processingStart - firstInputEntry.startTime > this.config.alertThresholds.interactionDelay) {
            this.createAlert({
              type: 'slow_interaction',
              severity: 'medium',
              timestamp: Date.now(),
              metric: 'first_input_delay',
              value: firstInputEntry.processingStart - firstInputEntry.startTime,
              threshold: this.config.alertThresholds.interactionDelay,
              message: `Slow interaction detected: ${(firstInputEntry.processingStart - firstInputEntry.startTime).toFixed(2)}ms`,
              recommendation: 'Optimize main thread blocking and reduce JavaScript execution time'
            });
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    }

    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      let cumulativeShift = 0;
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: PerformanceEntry & { hadRecentInput?: boolean; value?: number }) => {
          if (!entry.hadRecentInput && entry.value) {
            cumulativeShift += entry.value;

            if (cumulativeShift > this.config.alertThresholds.layoutShiftScore) {
              this.createAlert({
                type: 'large_layout_shift',
                severity: 'medium',
                timestamp: Date.now(),
                metric: 'cumulative_layout_shift',
                value: cumulativeShift,
                threshold: this.config.alertThresholds.layoutShiftScore,
                message: `Large layout shift detected: ${cumulativeShift.toFixed(3)}`,
                recommendation: 'Review images without dimensions, dynamic content insertion, and web fonts causing layout shifts'
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Check budget compliance for performance entry
   */
  private checkBudgetCompliance(entry: PerformanceEntry): void {
    const budget = this.config.budget.metrics;
    let exceeded = false;
    let metric = '';
    let value = 0;
    let threshold = 0;

    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint' && entry.startTime > budget.firstContentfulPaint) {
          exceeded = true;
          metric = 'first_contentful_paint';
          value = entry.startTime;
          threshold = budget.firstContentfulPaint;
        }
        break;

      case 'largest-contentful-paint':
        if (entry.startTime > budget.largestContentfulPaint) {
          exceeded = true;
          metric = 'largest_contentful_paint';
          value = entry.startTime;
          threshold = budget.largestContentfulPaint;
        }
        break;

      case 'first-input': {
        const fid = (entry as any).processingStart - entry.startTime;
        if (fid > budget.firstInputDelay) {
          exceeded = true;
          metric = 'first_input_delay';
          value = fid;
          threshold = budget.firstInputDelay;
        }
        break;
      }
    }

    if (exceeded) {
      this.createAlert({
        type: 'budget_exceeded',
        severity: 'medium',
        timestamp: Date.now(),
        metric,
        value,
        threshold,
        message: `Performance budget exceeded for ${metric}: ${value.toFixed(2)}ms`,
        recommendation: `Optimize ${metric} to meet budget threshold of ${threshold}ms`
      });
    }
  }

  /**
   * Check resource budget compliance
   */
  private checkResourceBudget(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const budget = this.config.budget.resources;

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let fontSize = 0;

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      totalSize += size;

      if (resource.name.includes('.js')) {
        jsSize += size;
      } else if (resource.name.includes('.css')) {
        cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
        imageSize += size;
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
        fontSize += size;
      }
    });

    // Check each budget category
    const checks = [
      { type: 'total', size: totalSize, budget: budget.totalSize },
      { type: 'js', size: jsSize, budget: budget.jsSize },
      { type: 'css', size: cssSize, budget: budget.cssSize },
      { type: 'image', size: imageSize, budget: budget.imageSize },
      { type: 'font', size: fontSize, budget: budget.fontSize }
    ];

    checks.forEach(check => {
      if (check.size > check.budget) {
        this.createAlert({
          type: 'budget_exceeded',
          severity: 'medium',
          timestamp: Date.now(),
          metric: `${check.type}_size`,
          value: check.size,
          threshold: check.budget,
          message: `Resource budget exceeded for ${check.type}: ${(check.size / 1024).toFixed(2)}KB`,
          recommendation: `Optimize ${check.type} resources to meet budget of ${(check.budget / 1024).toFixed(2)}KB`
        });
      }
    });
  }

  /**
   * Record user metric
   */
  private recordUserMetric(metric: string, value: number): void {
    if (!this.userMetrics.has(metric)) {
      this.userMetrics.set(metric, []);
    }
    this.userMetrics.get(metric)!.push(value);
  }

  /**
   * Create performance alert
   */
  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    if (this.config.debugMode) {
      console.warn(`⚠️ Performance Alert: ${alert.message}`, alert);
    }

    if (this.config.automaticReporting) {
      this.reportAlert(alert);
    }
  }

  /**
   * Report alert to server
   */
  private async reportAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await fetch('/api/performance-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      if (this.config.debugMode) {
        console.error('Failed to report performance alert:', error);
      }
    }
  }

  /**
   * Get advanced performance metrics
   */
  getAdvancedMetrics(): AdvancedPerformanceMetrics {
    const memory = (performance as any).memory;
    const connection = (navigator as any).connection;

    // Calculate user metrics
    const sessionDuration = performance.now() - this.sessionStartTime;
    const loadTimes = this.userMetrics.get('loadTime') || [];
    const errors = this.userMetrics.get('errors') || [];
    const conversions = this.userMetrics.get('conversions') || [];

    const averageLoadTime = loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
    const p95LoadTime = loadTimes.length > 0 ? loadTimes.sort((a, b) => a - b)[Math.floor(loadTimes.length * 0.95)] : 0;
    const errorRate = (errors.length / this.pageViews) * 100;
    const conversionRate = (conversions.length / this.pageViews) * 100;

    // Calculate budget compliance
    const baseMetrics = this.baseMonitor.calculateMetrics();
    const budget = this.config.budget.metrics;

    const budgetScores = {
      loading: this.calculateBudgetScore([
        { value: baseMetrics.firstContentfulPaint || 0, budget: budget.firstContentfulPaint },
        { value: baseMetrics.timeToInteractive || 0, budget: budget.speedIndex }
      ]),
      interactivity: this.calculateBudgetScore([
        { value: baseMetrics.interactionToResponseTime, budget: budget.firstInputDelay }
      ]),
      visualStability: this.calculateBudgetScore([
        { value: baseMetrics.criticalResourceLoadTime, budget: budget.totalBlockingTime }
      ]),
      accessibility: 100 // Would integrate with accessibility monitoring
    };

    const totalScore = Object.values(budgetScores).reduce((a, b) => a + b, 0) / 4;

    return {
      memoryUsage: memory ? {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      } : { used: 0, total: 0, limit: 0, percentage: 0 },

      networkTiming: connection ? {
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      } : { connectionType: 'unknown', effectiveType: 'unknown', downlink: 0, rtt: 0 },

      userEngagement: {
        sessionDuration,
        pageViews: this.pageViews,
        interactions: this.interactions,
        scrollDepth: this.maxScrollDepth,
        bounceRate: this.interactions === 0 ? 100 : 0
      },

      budgetCompliance: {
        totalScore,
        categoryScores: budgetScores
      },

      resourceEfficiency: {
        unusedCSS: 0, // Would need additional analysis
        unusedJS: 0, // Would need additional analysis
        totalResources: performance.getEntriesByType('resource').length,
        compressedResources: performance.getEntriesByType('resource').filter(r =>
          (r as PerformanceResourceTiming).responseStart - (r as PerformanceResourceTiming).requestStart < 100
        ).length,
        cachedResources: performance.getEntriesByType('resource').filter(r =>
          (r as PerformanceResourceTiming).transferSize === 0
        ).length
      },

      realUserMetrics: {
        averageLoadTime,
        p95LoadTime,
        errorRate,
        conversionRate
      }
    };
  }

  /**
   * Calculate budget compliance score
   */
  private calculateBudgetScore(metrics: Array<{ value: number; budget: number }>): number {
    const scores = metrics.map(({ value, budget }) => {
      if (value <= budget) return 100;
      if (value <= budget * 1.5) return Math.max(0, 100 - ((value - budget) / budget) * 100);
      return 0;
    });

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Get performance alerts
   */
  getAlerts(limit = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Generate comprehensive performance report
   */
  generateAdvancedReport(): {
    timestamp: string;
    baseMetrics: any;
    advancedMetrics: AdvancedPerformanceMetrics;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const baseMetrics = this.baseMonitor.generateOptimizationReport();
    const advancedMetrics = this.getAdvancedMetrics();
    const alerts = this.getAlerts(20);

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (advancedMetrics.memoryUsage.percentage > 80) {
      recommendations.push('High memory usage detected - consider optimizing memory-intensive operations');
    }

    if (advancedMetrics.userEngagement.bounceRate > 50) {
      recommendations.push('High bounce rate - improve initial page load experience');
    }

    if (advancedMetrics.budgetCompliance.totalScore < 80) {
      recommendations.push('Performance budget not met - review and optimize critical resources');
    }

    if (advancedMetrics.realUserMetrics.errorRate > 2) {
      recommendations.push('High error rate detected - review error logs and implement error handling');
    }

    return {
      timestamp: new Date().toISOString(),
      baseMetrics,
      advancedMetrics,
      alerts,
      recommendations
    };
  }

  /**
   * Export advanced performance data
   */
  exportAdvancedData(): string {
    const report = this.generateAdvancedReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Start advanced monitoring session
   */
  startAdvancedMonitoring(): void {
    if (this.config.debugMode) {
      console.log('📈 Advanced performance monitoring started');

      // Log advanced report every 2 minutes in debug mode
      setInterval(() => {
        console.group('📈 Advanced Performance Report');
        const report = this.generateAdvancedReport();
        console.log('Advanced Metrics:', report.advancedMetrics);
        console.log('Recent Alerts:', report.alerts.slice(-3));
        if (report.recommendations.length > 0) {
          console.log('Recommendations:', report.recommendations);
        }
        console.groupEnd();
      }, 2 * 60 * 1000);
    }
  }
}

// Global instance management
let globalAdvancedMonitor: AdvancedPerformanceMonitor;

export function initAdvancedPerformanceMonitor(config?: Partial<AdvancedPerformanceConfig>): AdvancedPerformanceMonitor {
  if (!globalAdvancedMonitor) {
    globalAdvancedMonitor = AdvancedPerformanceMonitor.getInstance(config);
  }
  return globalAdvancedMonitor;
}

export function getAdvancedPerformanceMonitor(): AdvancedPerformanceMonitor {
  if (!globalAdvancedMonitor) {
    globalAdvancedMonitor = AdvancedPerformanceMonitor.getInstance();
  }
  return globalAdvancedMonitor;
}

// Auto-initialize advanced monitoring
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const monitor = initAdvancedPerformanceMonitor();
      monitor.startAdvancedMonitoring();
    });
  } else {
    const monitor = initAdvancedPerformanceMonitor();
    monitor.startAdvancedMonitoring();
  }
}
