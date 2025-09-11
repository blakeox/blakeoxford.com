/**
 * Observability Orchestrator - Central Coordination System
 * Coordinates all monitoring systems and provides unified observability
 */

import { getPerformanceObserverManager } from './PerformanceObserverManager';
import { getConfigManager } from '../config/app-config';
import { ErrorHandler } from './AppError';

export interface ObservabilityConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  samplingRates: {
    performance: number;
    security: number;
    analytics: number;
  };
  debugMode: boolean;
  autoStart: boolean;
}

export interface SystemHealth {
  performance: {
    status: 'healthy' | 'degraded' | 'critical';
    metrics: Record<string, number>;
    alerts: string[];
  };
  security: {
    status: 'secure' | 'warning' | 'critical';
    threats: number;
    alerts: string[];
  };
  errors: {
    status: 'healthy' | 'warning' | 'critical';
    errorRate: number;
    recentErrors: number;
  };
  resources: {
    status: 'optimal' | 'limited' | 'critical';
    memoryUsage: number;
    networkLatency: number;
  };
}

export class ObservabilityOrchestrator {
  private static instance: ObservabilityOrchestrator;
  private config: ObservabilityConfig;
  private systems = new Map<string, any>();
  private healthMetrics: SystemHealth;
  private isInitialized = false;
  private configUnsubscribe?: () => void;
  private healthCheckInterval?: number;

  private constructor(config?: Partial<ObservabilityConfig>) {
    this.config = {
      enabled: true,
      environment: 'development',
      samplingRates: {
        performance: 0.1, // 10%
        security: 0.2,    // 20%
        analytics: 1.0    // 100%
      },
      debugMode: false,
      autoStart: true,
      ...config
    };

    this.healthMetrics = this.initializeHealthMetrics();
    
    if (this.config.autoStart) {
      this.initialize();
    }
  }

  static getInstance(config?: Partial<ObservabilityConfig>): ObservabilityOrchestrator {
    if (!ObservabilityOrchestrator.instance) {
      ObservabilityOrchestrator.instance = new ObservabilityOrchestrator(config);
    }
    return ObservabilityOrchestrator.instance;
  }

  /**
   * Initialize observability orchestration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Initializing Observability Orchestrator...');

      // Initialize configuration management
      await this.initializeConfigurationIntegration();

      // Initialize monitoring systems with coordination
      await this.initializeMonitoringSystems();

      // Setup cross-system correlation
      this.setupCorrelationTracking();

      // Setup health monitoring
      this.setupHealthMonitoring();

      // Setup error handling integration
      this.setupErrorHandlingIntegration();

      this.isInitialized = true;

      console.log('✅ Observability Orchestrator initialized successfully');
      
      if (this.config.debugMode) {
        this.logSystemStatus();
      }

    } catch (error) {
      console.error('❌ Failed to initialize Observability Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Initialize configuration integration
   */
  private async initializeConfigurationIntegration(): Promise<void> {
    const configManager = getConfigManager();
    const appConfig = configManager.getOptimizedConfig();
    
    // Update observability config based on app config
    this.updateConfigFromAppConfig(appConfig);

    // Subscribe to configuration changes
    this.configUnsubscribe = configManager.onChange((newConfig, changedKeys) => {
      this.handleConfigurationChange(newConfig, changedKeys);
    });
  }

  /**
   * Initialize monitoring systems with coordination
   */
  private async initializeMonitoringSystems(): Promise<void> {
    // Initialize systems based on environment and sampling
    if (this.shouldInitializeSystem('performance')) {
      await this.initializePerformanceMonitoring();
    }

    if (this.shouldInitializeSystem('security')) {
      await this.initializeSecurityMonitoring();
    }

    if (this.shouldInitializeSystem('analytics')) {
      await this.initializeAnalyticsIntegration();
    }

    console.log(`📊 Initialized monitoring systems for ${this.config.environment} environment`);
  }

  /**
   * Initialize performance monitoring with coordination
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      // Import and initialize performance systems dynamically
      const { getPerformanceMonitor } = await import('./PerformanceMonitor');
      const { getAdvancedPerformanceMonitor } = await import('./AdvancedPerformanceMonitor');
      
      const performanceMonitor = getPerformanceMonitor();
      const advancedMonitor = getAdvancedPerformanceMonitor();

      this.systems.set('performanceMonitor', performanceMonitor);
      this.systems.set('advancedPerformanceMonitor', advancedMonitor);

      console.log('📈 Performance monitoring initialized');
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  /**
   * Initialize security monitoring with coordination
   */
  private async initializeSecurityMonitoring(): Promise<void> {
    try {
      const { getSecurityMonitor } = await import('./SecurityMonitor');
      
      const securityMonitor = getSecurityMonitor();

      this.systems.set('securityMonitor', securityMonitor);

      console.log('🔒 Security monitoring initialized');
    } catch (error) {
      console.warn('Security monitoring initialization failed:', error);
    }
  }

  /**
   * Initialize analytics integration
   */
  private async initializeAnalyticsIntegration(): Promise<void> {
    try {
      // Import analytics systems dynamically
      const { Analytics } = await import('../scripts/modules/Analytics');

      this.systems.set('analytics', Analytics);
      console.log('📊 Analytics integration prepared');

    } catch (error) {
      console.warn('Analytics integration initialization failed:', error);
    }
  }

  /**
   * Setup correlation tracking across systems
   */
  private setupCorrelationTracking(): void {
    // Create correlation context for tracking events across systems
    const correlationContext = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      environment: this.config.environment
    };

    // Share correlation context with all systems
    this.systems.forEach((system) => {
      if (system && typeof system.setCorrelationContext === 'function') {
        system.setCorrelationContext(correlationContext);
      }
    });

    console.log('🔗 Cross-system correlation tracking enabled');
  }

  /**
   * Setup health monitoring
   */
  private setupHealthMonitoring(): void {
    // Periodic health checks
    this.healthCheckInterval = window.setInterval(() => {
      this.updateSystemHealth();
    }, 30000); // Every 30 seconds

    // Initial health check
    this.updateSystemHealth();
  }

  /**
   * Setup error handling integration
   */
  private setupErrorHandlingIntegration(): void {
    const errorHandler = ErrorHandler.getInstance();
    
    // Initialize with monitoring systems integration
    errorHandler.initialize(
      null, // Error display system reference
      {
        securityMonitor: this.systems.get('securityMonitor'),
        performanceMonitor: this.systems.get('performanceMonitor'),
        analyticsManager: this.systems.get('analyticsManager')
      }
    );

    console.log('🚨 Error handling integration enabled');
  }

  /**
   * Handle configuration changes
   */
  private handleConfigurationChange(newConfig: any, changedKeys: string[]): void {
    const relevantChanges = changedKeys.filter(key => 
      key.includes('performance') || 
      key.includes('analytics') || 
      key.includes('environment')
    );

    if (relevantChanges.length > 0) {
      console.log('🔄 Updating observability systems due to config changes:', relevantChanges);
      
      // Update system configurations
      this.updateSystemConfigurations(newConfig, relevantChanges);
    }
  }

  /**
   * Update system configurations
   */
  private updateSystemConfigurations(newConfig: any, changedKeys: string[]): void {
    // Update environment-specific optimizations
    if (changedKeys.includes('environment')) {
      this.config.environment = newConfig.environment;
      this.updateEnvironmentOptimizations();
    }

    // Update performance monitoring settings
    if (changedKeys.some(key => key.includes('performance'))) {
      const performanceMonitor = this.systems.get('advancedPerformanceMonitor');
      if (performanceMonitor && performanceMonitor.updateConfig) {
        performanceMonitor.updateConfig(newConfig.performance);
      }
    }

    // Update analytics settings
    if (changedKeys.some(key => key.includes('analytics'))) {
      const analyticsManager = this.systems.get('analyticsManager');
      if (analyticsManager && analyticsManager.updateConfig) {
        analyticsManager.updateConfig(newConfig.analytics);
      }
    }
  }

  /**
   * Update system health metrics
   */
  private updateSystemHealth(): void {
    try {
      // Collect metrics from all systems
      const performanceMonitor = this.systems.get('performanceMonitor');
      const securityMonitor = this.systems.get('securityMonitor');

      // Update performance health
      if (performanceMonitor && performanceMonitor.calculateMetrics) {
        const metrics = performanceMonitor.calculateMetrics();
        this.healthMetrics.performance = {
          status: this.getPerformanceStatus(metrics),
          metrics: metrics,
          alerts: this.getPerformanceAlerts(metrics)
        };
      }

      // Update security health
      if (securityMonitor && securityMonitor.getMetrics) {
        const securityMetrics = securityMonitor.getMetrics();
        this.healthMetrics.security = {
          status: this.getSecurityStatus(securityMetrics),
          threats: securityMetrics.suspiciousPatterns || 0,
          alerts: this.getSecurityAlerts(securityMetrics)
        };
      }

      // Update resource health
      this.updateResourceHealth();

      if (this.config.debugMode) {
        console.log('💚 System health updated:', this.healthMetrics);
      }

    } catch (error) {
      console.error('Failed to update system health:', error);
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    return { ...this.healthMetrics };
  }

  /**
   * Get observability status
   */
  getStatus(): {
    initialized: boolean;
    systems: string[];
    health: SystemHealth;
    config: ObservabilityConfig;
  } {
    return {
      initialized: this.isInitialized,
      systems: Array.from(this.systems.keys()),
      health: this.getSystemHealth(),
      config: { ...this.config }
    };
  }

  /**
   * Cleanup observability systems
   */
  cleanup(): void {
    // Cleanup configuration subscription
    if (this.configUnsubscribe) {
      this.configUnsubscribe();
    }

    // Cleanup health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Cleanup performance observer manager
    const observerManager = getPerformanceObserverManager();
    observerManager.cleanup();

    // Cleanup individual systems
    this.systems.forEach((system) => {
      if (system && typeof system.cleanup === 'function') {
        system.cleanup();
      }
    });

    this.systems.clear();
    this.isInitialized = false;

    console.log('🔍 Observability Orchestrator cleaned up');
  }

  // Private helper methods
  private initializeHealthMetrics(): SystemHealth {
    return {
      performance: { status: 'healthy', metrics: {}, alerts: [] },
      security: { status: 'secure', threats: 0, alerts: [] },
      errors: { status: 'healthy', errorRate: 0, recentErrors: 0 },
      resources: { status: 'optimal', memoryUsage: 0, networkLatency: 0 }
    };
  }

  private updateConfigFromAppConfig(appConfig: any): void {
    this.config = {
      ...this.config,
      environment: appConfig.environment || this.config.environment,
      debugMode: appConfig.performance?.debug || this.config.debugMode
    };
  }

  private shouldInitializeSystem(systemType: string): boolean {
    const samplingRate = this.config.samplingRates[systemType as keyof typeof this.config.samplingRates];
    return Math.random() <= samplingRate || this.config.environment === 'development';
  }

  private generateSessionId(): string {
    return `obs_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private getPerformanceStatus(metrics: any): 'healthy' | 'degraded' | 'critical' {
    if (metrics.errorRate > 10) return 'critical';
    if (metrics.averageModuleLoadTime > 1000) return 'degraded';
    return 'healthy';
  }

  private getSecurityStatus(metrics: any): 'secure' | 'warning' | 'critical' {
    if (metrics.suspiciousPatterns > 20) return 'critical';
    if (metrics.suspiciousPatterns > 5) return 'warning';
    return 'secure';
  }

  private getPerformanceAlerts(metrics: any): string[] {
    const alerts: string[] = [];
    if (metrics.errorRate > 5) {
      alerts.push(`High error rate: ${metrics.errorRate.toFixed(1)}%`);
    }
    if (metrics.averageModuleLoadTime > 500) {
      alerts.push(`Slow module loading: ${metrics.averageModuleLoadTime.toFixed(0)}ms`);
    }
    return alerts;
  }

  private getSecurityAlerts(metrics: any): string[] {
    const alerts: string[] = [];
    if (metrics.suspiciousPatterns > 10) {
      alerts.push(`High suspicious activity: ${metrics.suspiciousPatterns} patterns`);
    }
    if (metrics.cspViolations > 5) {
      alerts.push(`CSP violations detected: ${metrics.cspViolations}`);
    }
    return alerts;
  }

  private updateResourceHealth(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.healthMetrics.resources.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  private updateEnvironmentOptimizations(): void {
    // Update sampling rates based on environment
    if (this.config.environment === 'production') {
      this.config.samplingRates = {
        performance: 0.05, // 5%
        security: 0.1,     // 10%
        analytics: 1.0     // 100%
      };
    } else if (this.config.environment === 'development') {
      this.config.samplingRates = {
        performance: 1.0,  // 100%
        security: 1.0,     // 100%
        analytics: 1.0     // 100%
      };
    }
  }

  private logSystemStatus(): void {
    console.group('🔍 Observability System Status');
    console.log('Environment:', this.config.environment);
    console.log('Initialized Systems:', Array.from(this.systems.keys()));
    console.log('Sampling Rates:', this.config.samplingRates);
    console.log('Health Status:', this.healthMetrics);
    console.groupEnd();
  }
}

// Global instance management
export function getObservabilityOrchestrator(config?: Partial<ObservabilityConfig>): ObservabilityOrchestrator {
  return ObservabilityOrchestrator.getInstance(config);
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      getObservabilityOrchestrator();
    });
  } else {
    getObservabilityOrchestrator();
  }
}
