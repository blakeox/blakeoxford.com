/**
 * Performance Security Correlation Analysis
 * Correlates performance metrics with security events to identify threats
 */
import { PerformanceMonitor } from './PerformanceMonitor';
import { getSecurityMonitor } from './SecurityMonitor';
import { threatIntelligenceMonitor } from './ThreatIntelligenceMonitor';
// import removed: error reporter not used in this module

export interface PerformanceSecurityCorrelation {
  id: string;
  timestamp: number;
  correlationType: 'performance_degradation' | 'security_incident' | 'anomalous_pattern' | 'resource_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  performanceMetrics: {
    before: Record<string, number>;
    after: Record<string, number>;
    degradation: number; // percentage
  };
  securityEvents: Array<{
    type: string;
    count: number;
    timeframe: number;
  }>;
  correlation: {
    strength: number; // 0-100
    confidence: number; // 0-100
    pattern: string;
  };
  impact: {
    userExperience: number; // 0-100 negative impact score
    systemSecurity: number; // 0-100 risk score
    businessMetrics: string[];
  };
  recommendations: string[];
}

export interface PerformanceAnomalyDetection {
  id: string;
  timestamp: number;
  anomalyType: 'sudden_spike' | 'gradual_degradation' | 'periodic_pattern' | 'resource_exhaustion';
  metrics: {
    metric: string;
    baseline: number;
    current: number;
    deviation: number; // percentage from baseline
  }[];
  duration: number; // milliseconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  suspectedCause: string;
  securityImplications: string[];
}

export interface ResourceAbusePat
{
  id: string;
  resourceType: 'memory' | 'cpu' | 'network' | 'storage';
  pattern: string;
  threshold: number;
  currentUsage: number;
  abuseDuration: number;
  suspectedAttack: boolean;
  mitigation: string[];
}

export class PerformanceSecurityAnalyzer {
  private correlations: Map<string, PerformanceSecurityCorrelation> = new Map();
  private anomalies: Map<string, PerformanceAnomalyDetection> = new Map();
  private resourcePatterns: Map<string, ResourceAbusePat> = new Map();
  private baselineMetrics: Map<string, number[]> = new Map();
  // Removed unused errorReporter to reduce TS hints
  private isAnalyzing = false;
  private analysisInterval?: number;
  private performanceMonitor?: PerformanceMonitor;

  constructor() {
    this.initializeBaselines();
    this.startAnalysis();
  }

  /**
   * Initialize performance baselines
   */
  private initializeBaselines(): void {
    // Initialize baseline tracking for key metrics
    const keyMetrics = [
      'firstContentfulPaint',
      'timeToInteractive',
      'criticalResourceLoadTime',
      'bundleLoadTime',
      'averageModuleLoadTime',
      'interactionToResponseTime'
    ];

    keyMetrics.forEach(metric => {
      this.baselineMetrics.set(metric, []);
    });
  }

  /**
   * Start performance-security correlation analysis
   */
  startAnalysis(): void {
    if (this.isAnalyzing) return;

    this.performanceMonitor = new PerformanceMonitor();
    this.setupContinuousMonitoring();
    this.isAnalyzing = true;

    console.log('📊 Performance-Security Correlation Analysis started');
  }

  /**
   * Setup continuous monitoring and analysis
   */
  private setupContinuousMonitoring(): void {
    // Analyze correlations every 2 minutes
    this.analysisInterval = window.setInterval(() => {
      this.performCorrelationAnalysis();
      this.detectPerformanceAnomalies();
      this.analyzeResourceAbuse();
      this.updateBaselines();
    }, 120000) as unknown as number;

    // Immediate analysis on performance changes
    this.setupRealtimeAnalysis();
  }

  /**
   * Setup real-time performance change detection
   */
  private setupRealtimeAnalysis(): void {
    // Monitor Core Web Vitals changes
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.analyzePerformanceChange('lcp', entry.startTime);
          } else if (entry.entryType === 'layout-shift') {
            const layoutShift = entry as any;
            if (layoutShift.value > 0.1) {
              this.analyzeLayoutShiftSecurity(layoutShift);
            }
          }
        });
      });

      observer.observe({
        entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-input']
      });
    }

    // Monitor network errors that might indicate attacks
    document.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.analyzeResourceError(event);
      }
    }, true);

    // Monitor long tasks that might indicate resource exhaustion attacks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) { // Long task threshold
            this.analyzeLongTaskSecurity(entry);
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * Perform comprehensive correlation analysis
   */
  private performCorrelationAnalysis(): void {
    if (!this.performanceMonitor) return;

    const currentMetrics = this.performanceMonitor.calculateMetrics();
    const securityMonitor = getSecurityMonitor();
    const securityMetrics = securityMonitor.getMetrics();
    const recentEvents = securityMonitor.getEvents(20);

    // Look for correlations between performance degradation and security events
    const correlations = this.findPerformanceSecurityCorrelations(
      currentMetrics,
      securityMetrics,
      recentEvents
    );

    correlations.forEach(correlation => {
      this.correlations.set(correlation.id, correlation);

      if (correlation.severity === 'high' || correlation.severity === 'critical') {
        console.warn('🔍 Performance-Security Correlation Detected:', correlation);
      }
    });

    // Clean up old correlations (keep last 50)
    if (this.correlations.size > 50) {
      const sorted = Array.from(this.correlations.entries())
        .sort(([,a], [,b]) => b.timestamp - a.timestamp);
      this.correlations.clear();
      sorted.slice(0, 50).forEach(([id, correlation]) => {
        this.correlations.set(id, correlation);
      });
    }
  }

  /**
   * Find correlations between performance and security metrics
   */
  private findPerformanceSecurityCorrelations(
    performanceMetrics: any,
    securityMetrics: any,
    recentEvents: any[]
  ): PerformanceSecurityCorrelation[] {
    const correlations: PerformanceSecurityCorrelation[] = [];
    const now = Date.now();

    // Check for performance degradation during security events
    if (recentEvents.length > 5 && performanceMetrics.errorRate > 5) {
      const correlation: PerformanceSecurityCorrelation = {
        id: this.generateCorrelationId(),
        timestamp: now,
        correlationType: 'security_incident',
        severity: 'high',
        performanceMetrics: {
          before: {}, // Would need historical data
          after: performanceMetrics,
          degradation: performanceMetrics.errorRate
        },
        securityEvents: this.groupSecurityEvents(recentEvents),
        correlation: {
          strength: 85,
          confidence: 80,
          pattern: 'High error rate concurrent with security events'
        },
        impact: {
          userExperience: Math.min(100, performanceMetrics.errorRate * 10),
          systemSecurity: Math.min(100, recentEvents.length * 5),
          businessMetrics: ['User satisfaction decrease', 'Potential data breach']
        },
        recommendations: [
          'Investigate security events causing performance impact',
          'Implement rate limiting',
          'Scale infrastructure if under attack'
        ]
      };
      correlations.push(correlation);
    }

    // Check for resource abuse patterns
    if (performanceMetrics.bundleLoadTime > 5000 && securityMetrics.botRequests > 10) {
      const correlation: PerformanceSecurityCorrelation = {
        id: this.generateCorrelationId(),
        timestamp: now,
        correlationType: 'resource_abuse',
        severity: 'medium',
        performanceMetrics: {
          before: {},
          after: performanceMetrics,
          degradation: ((performanceMetrics.bundleLoadTime - 2000) / 2000) * 100
        },
        securityEvents: [{
          type: 'bot_requests',
          count: securityMetrics.botRequests,
          timeframe: 300000 // 5 minutes
        }],
        correlation: {
          strength: 70,
          confidence: 75,
          pattern: 'Slow resource loading with high bot activity'
        },
        impact: {
          userExperience: 60,
          systemSecurity: 40,
          businessMetrics: ['Page load performance', 'Server resource costs']
        },
        recommendations: [
          'Implement bot detection and blocking',
          'Add resource caching',
          'Monitor server resources'
        ]
      };
      correlations.push(correlation);
    }

    return correlations;
  }

  /**
   * Detect performance anomalies that might indicate security issues
   */
  private detectPerformanceAnomalies(): void {
    if (!this.performanceMonitor) return;

    const currentMetrics = this.performanceMonitor.calculateMetrics();
    const now = Date.now();

    // Check each metric against its baseline
    Object.entries(currentMetrics).forEach(([metric, value]) => {
      if (typeof value === 'number') {
        const baseline = this.getBaseline(metric);
        if (baseline > 0) {
          const deviation = ((value - baseline) / baseline) * 100;

          if (Math.abs(deviation) > 50) { // 50% deviation threshold
            const anomaly: PerformanceAnomalyDetection = {
              id: this.generateAnomalyId(),
              timestamp: now,
              anomalyType: deviation > 0 ? 'sudden_spike' : 'gradual_degradation',
              metrics: [{
                metric,
                baseline,
                current: value,
                deviation
              }],
              duration: 0, // Would need time series data
              severity: Math.abs(deviation) > 100 ? 'critical' :
                       Math.abs(deviation) > 75 ? 'high' : 'medium',
              suspectedCause: this.determineSuspectedCause(metric, deviation),
              securityImplications: this.getSecurityImplications(metric, deviation)
            };

            this.anomalies.set(anomaly.id, anomaly);

            if (anomaly.severity === 'critical') {
              console.error('🚨 Critical Performance Anomaly:', anomaly);
            }
          }
        }
      }
    });
  }

  /**
   * Analyze resource abuse patterns
   */
  private analyzeResourceAbuse(): void {
    const threatSummary = threatIntelligenceMonitor.getThreatSummary();

    // Check for potential DDoS patterns
    if (threatSummary.recentThreats > 10) {
      const resourcePattern: ResourceAbusePat = {
        id: this.generatePatternId(),
        resourceType: 'network',
        pattern: 'High threat activity',
        threshold: 5,
        currentUsage: threatSummary.recentThreats,
        abuseDuration: 0, // Would need time tracking
        suspectedAttack: true,
        mitigation: [
          'Enable DDoS protection',
          'Implement rate limiting',
          'Block suspicious IPs'
        ]
      };

      this.resourcePatterns.set(resourcePattern.id, resourcePattern);
    }

    // Memory exhaustion detection
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      if (memoryUsage > 80) {
        const resourcePattern: ResourceAbusePat = {
          id: this.generatePatternId(),
          resourceType: 'memory',
          pattern: 'High memory usage',
          threshold: 80,
          currentUsage: memoryUsage,
          abuseDuration: 0,
          suspectedAttack: memoryUsage > 95,
          mitigation: [
            'Check for memory leaks',
            'Restart application if necessary',
            'Monitor for malicious scripts'
          ]
        };

        this.resourcePatterns.set(resourcePattern.id, resourcePattern);
      }
    }
  }

  /**
   * Analyze performance changes for security implications
   */
  private analyzePerformanceChange(metric: string, value: number): void {
    const baseline = this.getBaseline(metric);
    if (baseline === 0) return;

    const change = ((value - baseline) / baseline) * 100;

    if (Math.abs(change) > 30) { // 30% threshold for immediate analysis
      // Check if this correlates with recent security events
      const securityMonitor = getSecurityMonitor();
      const recentEvents = securityMonitor.getEvents(5);

      if (recentEvents.length > 0) {
        const correlation: PerformanceSecurityCorrelation = {
          id: this.generateCorrelationId(),
          timestamp: Date.now(),
          correlationType: 'performance_degradation',
          severity: Math.abs(change) > 50 ? 'high' : 'medium',
          performanceMetrics: {
            before: { [metric]: baseline },
            after: { [metric]: value },
            degradation: Math.abs(change)
          },
          securityEvents: this.groupSecurityEvents(recentEvents),
          correlation: {
            strength: 75,
            confidence: 70,
            pattern: `${metric} change concurrent with security events`
          },
          impact: {
            userExperience: Math.min(100, Math.abs(change)),
            systemSecurity: Math.min(100, recentEvents.length * 10),
            businessMetrics: ['Performance degradation', 'User experience impact']
          },
          recommendations: [
            'Investigate recent security events',
            'Check system resources',
            'Monitor for ongoing attacks'
          ]
        };

        this.correlations.set(correlation.id, correlation);
      }
    }
  }

  /**
   * Analyze layout shifts for potential security implications
   */
  private analyzeLayoutShiftSecurity(layoutShift: any): void {
    // Large layout shifts might indicate:
    // 1. Content injection attacks
    // 2. Ad injection
    // 3. Malicious script execution

    if (layoutShift.value > 0.25) { // Significant layout shift
      const anomaly: PerformanceAnomalyDetection = {
        id: this.generateAnomalyId(),
        timestamp: Date.now(),
        anomalyType: 'sudden_spike',
        metrics: [{
          metric: 'cumulativeLayoutShift',
          baseline: 0.1,
          current: layoutShift.value,
          deviation: ((layoutShift.value - 0.1) / 0.1) * 100
        }],
        duration: 0,
        severity: layoutShift.value > 0.5 ? 'critical' : 'high',
        suspectedCause: 'Potential content injection or malicious script',
        securityImplications: [
          'Possible XSS attack',
          'Ad injection',
          'Malicious content insertion',
          'DOM manipulation attack'
        ]
      };

      this.anomalies.set(anomaly.id, anomaly);
      console.warn('🚨 Suspicious Layout Shift Detected:', anomaly);
    }
  }

  /**
   * Analyze resource loading errors for security implications
   */
  private analyzeResourceError(event: ErrorEvent): void {
    const target = event.target as HTMLElement;
    if (!target || !target.tagName) return;

    // Check if this is a potentially malicious resource
    const src = (target as any).src || (target as any).href;
    if (src && this.isSuspiciousResource(src)) {
      const anomaly: PerformanceAnomalyDetection = {
        id: this.generateAnomalyId(),
        timestamp: Date.now(),
        anomalyType: 'resource_exhaustion',
        metrics: [{
          metric: 'resourceLoadError',
          baseline: 0,
          current: 1,
          deviation: 100
        }],
        duration: 0,
        severity: 'medium',
        suspectedCause: 'Suspicious resource loading attempt',
        securityImplications: [
          'Potential malicious resource',
          'Content Security Policy violation',
          'Resource tampering attempt'
        ]
      };

      this.anomalies.set(anomaly.id, anomaly);
    }
  }

  /**
   * Analyze long tasks for security implications
   */
  private analyzeLongTaskSecurity(entry: PerformanceEntry): void {
    // Very long tasks might indicate:
    // 1. Cryptojacking
    // 2. DoS attacks via JavaScript
    // 3. Malicious computations

    if (entry.duration > 1000) { // Very long task (>1 second)
      const anomaly: PerformanceAnomalyDetection = {
        id: this.generateAnomalyId(),
        timestamp: Date.now(),
        anomalyType: 'resource_exhaustion',
        metrics: [{
          metric: 'longTaskDuration',
          baseline: 50,
          current: entry.duration,
          deviation: ((entry.duration - 50) / 50) * 100
        }],
        duration: entry.duration,
        severity: entry.duration > 5000 ? 'critical' : 'high',
        suspectedCause: 'Potential cryptojacking or malicious computation',
        securityImplications: [
          'Possible cryptojacking',
          'CPU exhaustion attack',
          'Malicious script execution',
          'Resource abuse'
        ]
      };

      this.anomalies.set(anomaly.id, anomaly);

      if (entry.duration > 5000) {
        console.error('🚨 Suspicious Long Task Detected:', anomaly);
      }
    }
  }

  /**
   * Helper methods
   */
  private getBaseline(metric: string): number {
    const values = this.baselineMetrics.get(metric) || [];
    if (values.length === 0) return 0;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private updateBaselines(): void {
    if (!this.performanceMonitor) return;

    const currentMetrics = this.performanceMonitor.calculateMetrics();

    Object.entries(currentMetrics).forEach(([metric, value]) => {
      if (typeof value === 'number' && value > 0) {
        const baseline = this.baselineMetrics.get(metric) || [];
        baseline.push(value);

        // Keep only last 10 values for rolling average
        if (baseline.length > 10) {
          baseline.shift();
        }

        this.baselineMetrics.set(metric, baseline);
      }
    });
  }

  private groupSecurityEvents(events: any[]): Array<{ type: string; count: number; timeframe: number }> {
    const grouped = new Map<string, number>();
    events.forEach(event => {
      const count = grouped.get(event.type) || 0;
      grouped.set(event.type, count + 1);
    });

    return Array.from(grouped.entries()).map(([type, count]) => ({
      type,
      count,
      timeframe: 300000 // 5 minutes
    }));
  }

  private determineSuspectedCause(metric: string, deviation: number): string {
    if (metric.includes('load') || metric.includes('Load')) {
      return deviation > 0 ? 'Network congestion or DDoS attack' : 'Caching improvement';
    }
    if (metric.includes('memory') || metric.includes('Memory')) {
      return deviation > 0 ? 'Memory leak or resource exhaustion attack' : 'Memory optimization';
    }
    if (metric.includes('response') || metric.includes('Response')) {
      return deviation > 0 ? 'Server overload or processing attack' : 'Performance optimization';
    }
    return 'Unknown performance change';
  }

  private getSecurityImplications(metric: string, deviation: number): string[] {
    const implications: string[] = [];

    if (deviation > 50) {
      implications.push('Potential system compromise');
      implications.push('Resource exhaustion attack');
    }

    if (metric.includes('network') || metric.includes('load')) {
      implications.push('DDoS attack possibility');
      implications.push('Network-based attack');
    }

    if (metric.includes('memory')) {
      implications.push('Memory exhaustion attack');
      implications.push('Potential cryptojacking');
    }

    return implications;
  }

  private isSuspiciousResource(url: string): boolean {
    const suspiciousPatterns = [
      /\.tk$|\.ml$|\.cf$|\.ga$/, // Suspicious TLDs
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
      /suspicious|malware|crypto|mining/i,
      /^data:|^javascript:|^vbscript:/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateAnomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generatePatternId(): string {
    return `patt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Public API methods
   */
  getCorrelationSummary(): {
    totalCorrelations: number;
    criticalCorrelations: number;
    recentCorrelations: number;
    topPatterns: string[];
    overallRiskScore: number;
  } {
    const correlations = Array.from(this.correlations.values());
    const recentCorrelations = correlations.filter(c =>
      Date.now() - c.timestamp < 3600000 // Last hour
    );

    const criticalCount = correlations.filter(c => c.severity === 'critical').length;
    const patterns = correlations.map(c => c.correlation.pattern);
    const uniquePatterns = [...new Set(patterns)];

    const riskScore = Math.min(100,
      (criticalCount * 25) +
      (recentCorrelations.length * 10) +
      (correlations.length * 2)
    );

    return {
      totalCorrelations: correlations.length,
      criticalCorrelations: criticalCount,
      recentCorrelations: recentCorrelations.length,
      topPatterns: uniquePatterns.slice(0, 5),
      overallRiskScore: riskScore
    };
  }

  getRecentAnomalies(limit = 10): PerformanceAnomalyDetection[] {
    return Array.from(this.anomalies.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  exportAnalysisData(): string {
    return JSON.stringify({
      correlations: Array.from(this.correlations.values()),
      anomalies: Array.from(this.anomalies.values()),
      resourcePatterns: Array.from(this.resourcePatterns.values()),
      baselines: Object.fromEntries(this.baselineMetrics),
      summary: this.getCorrelationSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  stopAnalysis(): void {
    if (this.analysisInterval) {
      window.clearInterval(this.analysisInterval);
      this.analysisInterval = undefined;
    }
    this.isAnalyzing = false;
    console.log('📊 Performance-Security Analysis stopped');
  }
}

// Export singleton instance
export const performanceSecurityAnalyzer = new PerformanceSecurityAnalyzer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceSecurityAnalyzer = performanceSecurityAnalyzer;
}
