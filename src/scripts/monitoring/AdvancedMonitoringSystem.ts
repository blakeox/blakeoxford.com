/**
 * Advanced Monitoring System - Comprehensive Security and Performance Monitoring
 * Initializes and coordinates all monitoring components
 */

import { initSecurityMonitor } from '../../utils/SecurityMonitor';
import { initAdvancedPerformanceMonitor } from '../../utils/AdvancedPerformanceMonitor';
import { initMonitoringDashboard } from '../../utils/MonitoringDashboard';
import { initPerformanceMonitor } from '../../utils/PerformanceMonitor';

export interface MonitoringSystemConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  sampling: {
    security: number; // 0-1, percentage of sessions to monitor
    performance: number;
    errors: number;
  };
  features: {
    securityMonitoring: boolean;
    performanceMonitoring: boolean;
    advancedPerformanceMonitoring: boolean;
    dashboard: boolean;
    realTimeAlerts: boolean;
    automaticReporting: boolean;
  };
  alerting: {
    enabled: boolean;
    criticalOnly: boolean;
    endpoints: {
      security: string;
      performance: string;
      general: string;
    };
  };
  dashboard: {
    hotkey: string; // Default: 'Ctrl+Shift+M'
    autoShow: boolean;
    updateInterval: number;
  };
  debug: boolean;
}

export class MonitoringSystem {
  private static instance: MonitoringSystem;
  private config: MonitoringSystemConfig;
  private initialized = false;
  private monitors = {
    security: null as any,
    performance: null as any,
    advancedPerformance: null as any,
    dashboard: null as any
  };
  
  private constructor(config?: Partial<MonitoringSystemConfig>) {
    const environment = (process.env.NODE_ENV as any) || 'production';
    
    this.config = {
      enabled: true,
      environment,
      sampling: {
        security: MonitoringSystem.getDefaultSamplingStatic(environment, 'security'),
        performance: MonitoringSystem.getDefaultSamplingStatic(environment, 'performance'),
        errors: 1.0 // Always monitor errors
      },
      features: {
        securityMonitoring: true,
        performanceMonitoring: true,
        advancedPerformanceMonitoring: environment !== 'production',
        dashboard: environment !== 'production',
        realTimeAlerts: true,
        automaticReporting: environment === 'production'
      },
      alerting: {
        enabled: true,
        criticalOnly: environment === 'production',
        endpoints: {
          security: '/api/security-report',
          performance: '/api/performance-alert',
          general: '/api/monitoring-alert'
        }
      },
      dashboard: {
        hotkey: 'Ctrl+Shift+M',
        autoShow: environment === 'development',
        updateInterval: 30000
      },
      debug: environment !== 'production',
      ...config
    };
  }
  
  static getInstance(config?: Partial<MonitoringSystemConfig>): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem(config);
    }
    return MonitoringSystem.instance;
  }
  
  /**
   * Get default sampling rate based on environment and monitor type
   */
  private static getDefaultSamplingStatic(environment: string, type: 'security' | 'performance'): number {
    switch (environment) {
      case 'development':
        return 1.0; // Monitor 100% in development
      case 'staging':
        return type === 'security' ? 0.5 : 0.3; // 50% security, 30% performance
      case 'production':
        return type === 'security' ? 0.2 : 0.1; // 20% security, 10% performance
      default:
        return 0.1;
    }
  }

  // Instance-level getDefaultSampling was unused; static helper is sufficient.
  
  /**
   * Initialize all monitoring systems
   */
  async initialize(): Promise<void> {
    if (this.initialized || !this.config.enabled) {
      return;
    }
    
    if (typeof window === 'undefined') {
      console.warn('Monitoring system can only be initialized in browser environment');
      return;
    }
    
    try {
      console.log('🔍 Initializing Advanced Monitoring System...');
      
      // Initialize base performance monitor (always enabled)
      this.monitors.performance = initPerformanceMonitor();
      
      // Initialize security monitoring
      if (this.config.features.securityMonitoring && this.shouldSample('security')) {
        this.monitors.security = initSecurityMonitor({
          enabled: true,
          debugMode: this.config.debug,
          csrfProtection: { enabled: true, tokenLength: 32 },
          contentSecurityPolicy: {
            enabled: true,
            reportOnly: this.config.environment !== 'production',
            reportUri: this.config.alerting.endpoints.security
          }
        });
        
        console.log('🔒 Security monitoring initialized');
      }
      
      // Initialize advanced performance monitoring
      if (this.config.features.advancedPerformanceMonitoring && this.shouldSample('performance')) {
        this.monitors.advancedPerformance = initAdvancedPerformanceMonitor({
          enabled: true,
          samplingRate: this.config.sampling.performance,
          debugMode: this.config.debug,
          automaticReporting: this.config.features.automaticReporting,
          alertThresholds: {
            memoryUsage: this.config.environment === 'production' ? 150 : 100, // MB
            interactionDelay: this.config.environment === 'production' ? 300 : 200, // ms
            layoutShiftScore: 0.1,
            errorRate: this.config.environment === 'production' ? 2 : 5 // %
          }
        });
        
        console.log('📈 Advanced performance monitoring initialized');
      }
      
      // Initialize monitoring dashboard
      if (this.config.features.dashboard) {
        this.monitors.dashboard = initMonitoringDashboard({
          enabled: true,
          updateInterval: this.config.dashboard.updateInterval,
          autoRefresh: true,
          notifications: {
            enabled: this.config.alerting.enabled,
            criticalOnly: this.config.alerting.criticalOnly,
            sound: this.config.environment === 'development'
          }
        });
        
        console.log(`📊 Monitoring dashboard initialized - Press ${this.config.dashboard.hotkey} to toggle`);
        
        // Auto-show dashboard in development
        if (this.config.dashboard.autoShow) {
          setTimeout(() => {
            this.monitors.dashboard?.showDashboard();
          }, 2000);
        }
      }
      
      // Setup global error handling
      this.setupGlobalErrorHandling();
      
      // Setup periodic health checks
      this.setupHealthChecks();
      
      // Setup performance budgets
      this.setupPerformanceBudgets();
      
      this.initialized = true;
      
      console.log('✅ Advanced Monitoring System fully initialized');
      this.logSystemStatus();
      
    } catch (error) {
      console.error('Failed to initialize monitoring system:', error);
    }
  }
  
  /**
   * Check if we should sample this session
   */
  private shouldSample(type: 'security' | 'performance'): boolean {
    return Math.random() <= this.config.sampling[type];
  }
  
  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    // Enhanced error handling
    window.addEventListener('error', (event) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      if (this.config.debug) {
        console.error('🚨 JavaScript Error:', errorInfo);
      }
      
      // Report to monitoring system
      this.reportError('javascript_error', errorInfo);
    });
    
    // Enhanced promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      const errorInfo = {
        reason: event.reason,
        promise: event.promise.toString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      if (this.config.debug) {
        console.error('🚨 Unhandled Promise Rejection:', errorInfo);
      }
      
      // Report to monitoring system
      this.reportError('promise_rejection', errorInfo);
    });
  }
  
  /**
   * Setup periodic health checks
   */
  private setupHealthChecks(): void {
    // Memory usage check
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
        
        if (memoryUsage > 200) { // 200MB threshold
          this.reportAlert('memory_warning', {
            type: 'memory_usage',
            value: memoryUsage,
            threshold: 200,
            message: `High memory usage: ${memoryUsage.toFixed(2)}MB`
          });
        }
      }, 60000); // Check every minute
    }
    
    // Performance degradation check
    let lastPerformanceCheck = performance.now();
    setInterval(() => {
      const now = performance.now();
      const timeDiff = now - lastPerformanceCheck;
      
      // If interval is significantly delayed, main thread might be blocked
      if (timeDiff > 35000) { // 5 seconds longer than expected
        this.reportAlert('performance_warning', {
          type: 'main_thread_blocking',
          value: timeDiff,
          threshold: 30000,
          message: `Main thread blocking detected: ${(timeDiff - 30000).toFixed(0)}ms delay`
        });
      }
      
      lastPerformanceCheck = now;
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Setup performance budgets
   */
  private setupPerformanceBudgets(): void {
    // Critical resource timing budget
    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        resources.forEach(resource => {
          const loadTime = resource.responseEnd - resource.startTime;
          
          // Check for slow critical resources
          if (resource.name.includes('critical') && loadTime > 1000) {
            this.reportAlert('budget_exceeded', {
              type: 'critical_resource_slow',
              value: loadTime,
              threshold: 1000,
              message: `Critical resource loaded slowly: ${resource.name} (${loadTime.toFixed(0)}ms)`
            });
          }
          
          // Check for large resources
          if (resource.transferSize > 500000) { // 500KB
            this.reportAlert('budget_exceeded', {
              type: 'large_resource',
              value: resource.transferSize,
              threshold: 500000,
              message: `Large resource detected: ${resource.name} (${(resource.transferSize / 1024).toFixed(0)}KB)`
            });
          }
        });
      }, 2000);
    });
  }
  
  /**
   * Report error to monitoring system
   */
  private async reportError(type: string, data: any): Promise<void> {
    if (!this.config.features.automaticReporting) return;
    
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          environment: this.config.environment,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to report error:', error);
      }
    }
  }
  
  /**
   * Report alert to monitoring system
   */
  private async reportAlert(category: string, data: any): Promise<void> {
    if (!this.config.alerting.enabled) return;
    
    try {
      await fetch('/api/monitoring-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          data,
          timestamp: Date.now(),
          environment: this.config.environment,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to report alert:', error);
      }
    }
  }
  
  /**
   * Log system status
   */
  private logSystemStatus(): void {
    if (!this.config.debug) return;
    
    console.group('🔍 Monitoring System Status');
    console.log('Environment:', this.config.environment);
    console.log('Sampling Rates:', this.config.sampling);
    console.log('Active Features:', Object.entries(this.config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature));
    console.log('Dashboard Hotkey:', this.config.dashboard.hotkey);
    console.log('Debug Mode:', this.config.debug);
    console.groupEnd();
  }
  
  /**
   * Get monitoring system status
   */
  getStatus(): {
    initialized: boolean;
    config: MonitoringSystemConfig;
    activeMonitors: string[];
    performance: any;
    errors: number;
  } {
    return {
      initialized: this.initialized,
      config: this.config,
      activeMonitors: Object.entries(this.monitors)
        .filter(([, monitor]) => monitor !== null)
        .map(([name]) => name),
      performance: this.monitors.performance?.calculateMetrics(),
      errors: 0 // Would track errors over time
    };
  }
  
  /**
   * Generate comprehensive monitoring report
   */
  generateReport(): any {
    const reports: any = {
      timestamp: new Date().toISOString(),
      system: this.getStatus()
    };
    
    if (this.monitors.security) {
      reports.security = this.monitors.security.generateSecurityReport();
    }
    
    if (this.monitors.advancedPerformance) {
      reports.performance = this.monitors.advancedPerformance.generateAdvancedReport();
    }
    
    if (this.monitors.dashboard) {
      reports.dashboard = this.monitors.dashboard.getHistory();
    }
    
    return reports;
  }
  
  /**
   * Export all monitoring data
   */
  exportData(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }
  
  /**
   * Shutdown monitoring system
   */
  shutdown(): void {
    if (!this.initialized) return;
    
    console.log('🔻 Shutting down monitoring system...');
    
    // Clean up monitors
    Object.values(this.monitors).forEach(monitor => {
      if (monitor && typeof monitor.disconnect === 'function') {
        monitor.disconnect();
      }
    });
    
    this.initialized = false;
    console.log('✅ Monitoring system shutdown complete');
  }
}

// Global instance management
let globalMonitoringSystem: MonitoringSystem;

export function initMonitoringSystem(config?: Partial<MonitoringSystemConfig>): MonitoringSystem {
  if (!globalMonitoringSystem) {
    globalMonitoringSystem = MonitoringSystem.getInstance(config);
  }
  return globalMonitoringSystem;
}

export function getMonitoringSystem(): MonitoringSystem {
  if (!globalMonitoringSystem) {
    globalMonitoringSystem = MonitoringSystem.getInstance();
  }
  return globalMonitoringSystem;
}

// Auto-initialize monitoring system
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      const system = initMonitoringSystem();
      await system.initialize();
    });
  } else {
    const system = initMonitoringSystem();
    system.initialize();
  }
  
  // Shutdown on page unload
  window.addEventListener('beforeunload', () => {
    if (globalMonitoringSystem) {
      globalMonitoringSystem.shutdown();
    }
  });
}
