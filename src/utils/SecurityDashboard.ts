/**
 * Real-time Security Dashboard - Unified monitoring interface
 * Integrates all security monitoring systems into a comprehensive dashboard
 */
import { getSecurityMonitor } from './SecurityMonitor';
import { complianceDashboard } from './ComplianceDashboard';
import { threatIntelligenceMonitor } from './ThreatIntelligenceMonitor';
import { performanceSecurityAnalyzer } from './PerformanceSecurityAnalyzer';
import { securityAuditor } from './SecurityAuditor';
import { createModuleErrorReporter } from './ModuleErrorHandling';

export interface DashboardMetrics {
  timestamp: number;
  systemHealth: {
    overall: number; // 0-100
    security: number;
    compliance: number;
    performance: number;
    threats: number;
  };
  alerts: {
    critical: AlertItem[];
    high: AlertItem[];
    medium: AlertItem[];
    low: AlertItem[];
    total: number;
  };
  realTimeStats: {
    activeThreats: number;
    blockedRequests: number;
    complianceScore: number;
    performanceIssues: number;
    riskScore: number;
  };
  trends: {
    securityTrend: 'improving' | 'stable' | 'declining';
    complianceTrend: 'improving' | 'stable' | 'declining';
    threatTrend: 'improving' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface AlertItem {
  id: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'compliance' | 'performance' | 'threat' | 'system';
  title: string;
  description: string;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
  actions: string[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'alert' | 'status' | 'trend';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data: any;
  refreshInterval: number;
  visible: boolean;
}

export interface SecurityIncident {
  id: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description: string;
  category: string;
  source: string;
  affectedSystems: string[];
  timeline: {
    timestamp: number;
    action: string;
    user?: string;
    details: string;
  }[];
  mitigation: {
    automated: string[];
    manual: string[];
    recommended: string[];
  };
  impact: {
    users: number;
    systems: string[];
    dataExposure: boolean;
    serviceDisruption: boolean;
  };
}

export class SecurityDashboard {
  private metrics: DashboardMetrics[] = [];
  private alerts: Map<string, AlertItem> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private errorReporter = createModuleErrorReporter('SecurityDashboard');
  private updateInterval?: number;
  private isActive = false;
  private subscribers: Array<(metrics: DashboardMetrics) => void> = [];

  constructor() {
    this.initializeWidgets();
    this.startRealTimeUpdates();
  }

  /**
   * Initialize default dashboard widgets
   */
  private initializeWidgets(): void {
    const defaultWidgets: Omit<DashboardWidget, 'data'>[] = [
      {
        id: 'system-health-overview',
        title: 'System Health Overview',
        type: 'metric',
        size: 'large',
        position: { x: 0, y: 0 },
        refreshInterval: 30000,
        visible: true
      },
      {
        id: 'active-threats',
        title: 'Active Threats',
        type: 'alert',
        size: 'medium',
        position: { x: 1, y: 0 },
        refreshInterval: 10000,
        visible: true
      },
      {
        id: 'compliance-status',
        title: 'Compliance Status',
        type: 'status',
        size: 'medium',
        position: { x: 0, y: 1 },
        refreshInterval: 300000, // 5 minutes
        visible: true
      },
      {
        id: 'performance-security',
        title: 'Performance Security',
        type: 'chart',
        size: 'medium',
        position: { x: 1, y: 1 },
        refreshInterval: 60000,
        visible: true
      },
      {
        id: 'security-trends',
        title: 'Security Trends',
        type: 'trend',
        size: 'large',
        position: { x: 0, y: 2 },
        refreshInterval: 120000,
        visible: true
      },
      {
        id: 'recent-incidents',
        title: 'Recent Incidents',
        type: 'alert',
        size: 'medium',
        position: { x: 2, y: 0 },
        refreshInterval: 30000,
        visible: true
      }
    ];

    defaultWidgets.forEach(widget => {
      this.widgets.set(widget.id, {
        ...widget,
        data: null
      });
    });
  }

  /**
   * Start real-time dashboard updates
   */
  startRealTimeUpdates(): void {
    if (this.isActive) return;

    this.isActive = true;
    
    // Initial update
    this.updateMetrics();

    // Set up periodic updates
    this.updateInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 10000) as unknown as number; // Update every 10 seconds

    console.log('🖥️ Security Dashboard started with real-time updates');
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    this.isActive = false;
    console.log('🖥️ Security Dashboard real-time updates stopped');
  }

  /**
   * Update dashboard metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();

      // Gather data from all monitoring systems
      const securityMetrics = getSecurityMonitor().getMetrics();
      const complianceReport = complianceDashboard.getLatestReport();
      const threatSummary = threatIntelligenceMonitor.getThreatSummary();
      const performanceSummary = performanceSecurityAnalyzer.getCorrelationSummary();
      const auditResult = securityAuditor.getLatestAudit();

      // Calculate system health scores
      const systemHealth = {
        overall: this.calculateOverallHealth(securityMetrics, complianceReport, threatSummary, performanceSummary),
        security: this.calculateSecurityHealth(securityMetrics, auditResult),
        compliance: complianceReport?.overallScore || 0,
        performance: this.calculatePerformanceHealth(performanceSummary),
        threats: Math.max(0, 100 - threatSummary.riskScore)
      };

      // Process alerts from all systems
      const alerts = this.processAlerts(securityMetrics, threatSummary, complianceReport, performanceSummary);

      // Calculate real-time stats
      const realTimeStats = {
        activeThreats: threatSummary.criticalThreats + threatSummary.highThreats,
        blockedRequests: securityMetrics.blockedRequests || 0,
        complianceScore: complianceReport?.overallScore || 0,
        performanceIssues: performanceSummary.criticalCorrelations || 0,
        riskScore: threatSummary.riskScore
      };

      // Calculate trends
      const trends = this.calculateTrends(systemHealth);

      const dashboardMetrics: DashboardMetrics = {
        timestamp,
        systemHealth,
        alerts,
        realTimeStats,
        trends
      };

      this.metrics.push(dashboardMetrics);

      // Keep only last 100 metrics (about 16 minutes of data at 10s intervals)
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Update widget data
      await this.updateWidgetData(dashboardMetrics);

      // Notify subscribers
      this.notifySubscribers(dashboardMetrics);

      // Check for incidents
      this.checkForIncidents(dashboardMetrics);

    } catch (error) {
      this.errorReporter.reportError(
        'DASHBOARD_UPDATE_FAILED',
        'Failed to update dashboard metrics',
        'medium' as any,
        {
          component: 'DashboardUpdate',
          additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );
    }
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(
    securityMetrics: any,
    complianceReport: any,
    threatSummary: any,
    performanceSummary: any
  ): number {
    const weights = {
      security: 0.3,
      compliance: 0.2,
      threats: 0.3,
      performance: 0.2
    };

    const securityScore = Math.max(0, 100 - (securityMetrics.suspiciousPatterns * 5));
    const complianceScore = complianceReport?.overallScore || 0;
    const threatScore = Math.max(0, 100 - threatSummary.riskScore);
    const performanceScore = Math.max(0, 100 - (performanceSummary.criticalCorrelations * 10));

    return Math.round(
      securityScore * weights.security +
      complianceScore * weights.compliance +
      threatScore * weights.threats +
      performanceScore * weights.performance
    );
  }

  /**
   * Calculate security-specific health score
   */
  private calculateSecurityHealth(securityMetrics: any, auditResult: any): number {
    if (!auditResult) {
      return Math.max(0, 100 - (securityMetrics.suspiciousPatterns * 5));
    }

    return auditResult.overallScore;
  }

  /**
   * Calculate performance health score
   */
  private calculatePerformanceHealth(performanceSummary: any): number {
    return Math.max(0, 100 - (performanceSummary.criticalCorrelations * 10));
  }

  /**
   * Process alerts from all monitoring systems
   */
  private processAlerts(
    securityMetrics: any,
    threatSummary: any,
    complianceReport: any,
    performanceSummary: any
  ): DashboardMetrics['alerts'] {
    const alerts: {
      critical: AlertItem[];
      high: AlertItem[];
      medium: AlertItem[];
      low: AlertItem[];
      total: number;
    } = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      total: 0
    };

    // Security alerts
    if (securityMetrics.suspiciousPatterns > 10) {
      const alert: AlertItem = {
        id: `security-suspicious-${Date.now()}`,
        timestamp: Date.now(),
        severity: securityMetrics.suspiciousPatterns > 20 ? 'critical' : 'high',
        category: 'security',
        title: 'High Suspicious Activity',
        description: `${securityMetrics.suspiciousPatterns} suspicious patterns detected`,
        source: 'SecurityMonitor',
        acknowledged: false,
        resolved: false,
        actions: ['Review security logs', 'Check for attack patterns', 'Consider blocking suspicious IPs']
      };
      
      if (alert.severity === 'critical') {
        alerts.critical.push(alert);
      } else {
        alerts.high.push(alert);
      }
    }

    // Threat alerts
    if (threatSummary.criticalThreats > 0) {
      const alert: AlertItem = {
        id: `threat-critical-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'critical',
        category: 'threat',
        title: 'Critical Threats Detected',
        description: `${threatSummary.criticalThreats} critical threats require immediate attention`,
        source: 'ThreatIntelligence',
        acknowledged: false,
        resolved: false,
        actions: ['Investigate threat sources', 'Implement blocking measures', 'Alert security team']
      };
      alerts.critical.push(alert);
    }

    if (threatSummary.highThreats > 0) {
      const alert: AlertItem = {
        id: `threat-high-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'high',
        category: 'threat',
        title: 'High Priority Threats',
        description: `${threatSummary.highThreats} high priority threats detected`,
        source: 'ThreatIntelligence',
        acknowledged: false,
        resolved: false,
        actions: ['Monitor closely', 'Prepare response measures', 'Document patterns']
      };
      alerts.high.push(alert);
    }

    // Compliance alerts
    if (complianceReport && complianceReport.overallScore < 70) {
      const alert: AlertItem = {
        id: `compliance-low-${Date.now()}`,
        timestamp: Date.now(),
        severity: complianceReport.overallScore < 50 ? 'high' : 'medium',
        category: 'compliance',
        title: 'Compliance Score Below Threshold',
        description: `Compliance score is ${complianceReport.overallScore}/100`,
        source: 'ComplianceDashboard',
        acknowledged: false,
        resolved: false,
        actions: ['Review failed checks', 'Implement compliance fixes', 'Schedule compliance review']
      };
      
      if (alert.severity === 'high') {
        alerts.high.push(alert);
      } else {
        alerts.medium.push(alert);
      }
    }

    // Performance security alerts
    if (performanceSummary.criticalCorrelations > 5) {
      const alert: AlertItem = {
        id: `performance-anomalies-${Date.now()}`,
        timestamp: Date.now(),
        severity: performanceSummary.criticalCorrelations > 10 ? 'high' : 'medium',
        category: 'performance',
        title: 'Performance Anomalies Detected',
        description: `${performanceSummary.criticalCorrelations} performance anomalies may indicate security issues`,
        source: 'PerformanceSecurityAnalyzer',
        acknowledged: false,
        resolved: false,
        actions: ['Analyze performance patterns', 'Check for DDoS attacks', 'Review system resources']
      };
      
      if (alert.severity === 'high') {
        alerts.high.push(alert);
      } else {
        alerts.medium.push(alert);
      }
    }

    alerts.total = alerts.critical.length + alerts.high.length + alerts.medium.length + alerts.low.length;

    // Store alerts for tracking
    [...alerts.critical, ...alerts.high, ...alerts.medium, ...alerts.low].forEach(alert => {
      this.alerts.set(alert.id, alert);
    });

    return alerts;
  }

  /**
   * Calculate system trends
   */
  private calculateTrends(currentHealth: DashboardMetrics['systemHealth']): DashboardMetrics['trends'] {
    const previousMetrics = this.metrics[this.metrics.length - 10]; // Compare with 10 updates ago (100 seconds)
    
    if (!previousMetrics) {
      return {
        securityTrend: 'stable',
        complianceTrend: 'stable',
        threatTrend: 'stable',
        performanceTrend: 'stable'
      };
    }

    const calculateTrend = (current: number, previous: number): 'improving' | 'stable' | 'declining' => {
      const diff = current - previous;
      if (diff > 5) return 'improving';
      if (diff < -5) return 'declining';
      return 'stable';
    };

    return {
      securityTrend: calculateTrend(currentHealth.security, previousMetrics.systemHealth.security),
      complianceTrend: calculateTrend(currentHealth.compliance, previousMetrics.systemHealth.compliance),
      threatTrend: calculateTrend(currentHealth.threats, previousMetrics.systemHealth.threats),
      performanceTrend: calculateTrend(currentHealth.performance, previousMetrics.systemHealth.performance)
    };
  }

  /**
   * Update widget data
   */
  private async updateWidgetData(metrics: DashboardMetrics): Promise<void> {
    for (const [widgetId, widget] of this.widgets) {
      try {
        switch (widgetId) {
          case 'system-health-overview':
            widget.data = {
              overall: metrics.systemHealth.overall,
              breakdown: metrics.systemHealth,
              status: this.getHealthStatus(metrics.systemHealth.overall),
              lastUpdate: metrics.timestamp
            };
            break;

          case 'active-threats':
            widget.data = {
              critical: metrics.alerts.critical,
              high: metrics.alerts.high,
              total: metrics.realTimeStats.activeThreats,
              riskScore: metrics.realTimeStats.riskScore
            };
            break;

          case 'compliance-status':
            widget.data = {
              score: metrics.realTimeStats.complianceScore,
              trend: metrics.trends.complianceTrend,
              status: this.getComplianceStatus(metrics.realTimeStats.complianceScore)
            };
            break;

          case 'performance-security':
            widget.data = {
              anomalies: metrics.realTimeStats.performanceIssues,
              trend: metrics.trends.performanceTrend,
              blockedRequests: metrics.realTimeStats.blockedRequests
            };
            break;

          case 'security-trends':
            widget.data = {
              historical: this.metrics.slice(-20).map(m => ({
                timestamp: m.timestamp,
                overall: m.systemHealth.overall,
                security: m.systemHealth.security,
                threats: m.systemHealth.threats
              })),
              trends: metrics.trends
            };
            break;

          case 'recent-incidents':
            widget.data = {
              incidents: Array.from(this.incidents.values())
                .filter(i => i.status === 'open' || i.status === 'investigating')
                .slice(0, 5),
              totalOpen: Array.from(this.incidents.values()).filter(i => i.status === 'open').length
            };
            break;
        }
      } catch (error) {
        console.warn(`Failed to update widget ${widgetId}:`, error);
      }
    }
  }

  /**
   * Check for and create security incidents
   */
  private checkForIncidents(metrics: DashboardMetrics): void {
    // Critical threat incident
    if (metrics.alerts.critical.length > 0) {
      const criticalAlerts = metrics.alerts.critical.filter(a => a.category === 'threat' || a.category === 'security');
      
      if (criticalAlerts.length > 0) {
        this.createIncident({
          severity: 'critical',
          title: 'Critical Security Threats Detected',
          description: `${criticalAlerts.length} critical security threats require immediate response`,
          category: 'security_breach',
          source: 'AutomaticDetection',
          affectedSystems: ['web_application'],
          mitigation: {
            automated: ['Alert security team', 'Increase monitoring'],
            manual: ['Investigate threat sources', 'Implement blocking measures'],
            recommended: ['Contact incident response team', 'Prepare containment measures']
          },
          impact: {
            users: 0,
            systems: ['web_application'],
            dataExposure: false,
            serviceDisruption: false
          }
        });
      }
    }

    // System health degradation incident
    if (metrics.systemHealth.overall < 50) {
      this.createIncident({
        severity: 'high',
        title: 'System Health Degradation',
        description: `Overall system health has dropped to ${metrics.systemHealth.overall}/100`,
        category: 'system_degradation',
        source: 'HealthMonitoring',
        affectedSystems: ['monitoring_system'],
        mitigation: {
          automated: ['Increase monitoring frequency', 'Alert operations team'],
          manual: ['Investigate root causes', 'Review system resources'],
          recommended: ['Scale monitoring infrastructure', 'Review security policies']
        },
        impact: {
          users: 0,
          systems: ['monitoring_system'],
          dataExposure: false,
          serviceDisruption: true
        }
      });
    }
  }

  /**
   * Create a security incident
   */
  createIncident(incidentData: Omit<SecurityIncident, 'id' | 'timestamp' | 'status' | 'timeline'>): SecurityIncident {
    const incident: SecurityIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      status: 'open',
      ...incidentData,
      timeline: [
        {
          timestamp: Date.now(),
          action: 'Incident Created',
          details: 'Automatically detected and created incident'
        }
      ]
    };

    this.incidents.set(incident.id, incident);
    console.warn(`🚨 Security Incident Created: ${incident.title} (${incident.severity})`);
    
    return incident;
  }

  /**
   * Helper methods for status determination
   */
  private getHealthStatus(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 50) return 'Poor';
    return 'Critical';
  }

  private getComplianceStatus(score: number): string {
    if (score >= 95) return 'Fully Compliant';
    if (score >= 85) return 'Mostly Compliant';
    if (score >= 70) return 'Partially Compliant';
    return 'Non-Compliant';
  }

  /**
   * Public API methods
   */
  subscribe(callback: (metrics: DashboardMetrics) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(metrics: DashboardMetrics): void {
    this.subscribers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.warn('Dashboard subscriber callback failed:', error);
      }
    });
  }

  getCurrentMetrics(): DashboardMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getHistoricalMetrics(minutes: number = 10): DashboardMetrics[] {
    const since = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= since);
  }

  getActiveAlerts(): AlertItem[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  getOpenIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values()).filter(i => i.status === 'open' || i.status === 'investigating');
  }

  updateIncident(incidentId: string, updates: Partial<SecurityIncident>): boolean {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      Object.assign(incident, updates);
      
      // Add timeline entry
      incident.timeline.push({
        timestamp: Date.now(),
        action: 'Incident Updated',
        details: `Updated: ${Object.keys(updates).join(', ')}`
      });
      
      return true;
    }
    return false;
  }

  exportDashboardData(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: Array.from(this.alerts.values()),
      incidents: Array.from(this.incidents.values()),
      widgets: Array.from(this.widgets.values()),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  getDashboardSummary(): {
    systemHealth: number;
    activeThreats: number;
    openIncidents: number;
    alertsCritical: number;
    alertsHigh: number;
    complianceScore: number;
    lastUpdate: number;
  } {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        systemHealth: 0,
        activeThreats: 0,
        openIncidents: 0,
        alertsCritical: 0,
        alertsHigh: 0,
        complianceScore: 0,
        lastUpdate: 0
      };
    }

    return {
      systemHealth: current.systemHealth.overall,
      activeThreats: current.realTimeStats.activeThreats,
      openIncidents: this.getOpenIncidents().length,
      alertsCritical: current.alerts.critical.length,
      alertsHigh: current.alerts.high.length,
      complianceScore: current.realTimeStats.complianceScore,
      lastUpdate: current.timestamp
    };
  }
}

// Export singleton instance
export const securityDashboard = new SecurityDashboard();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).securityDashboard = securityDashboard;
}
