/**
 * Monitoring Dashboard - Comprehensive Security and Performance Monitoring Dashboard
 * Provides real-time visibility into security threats and performance metrics
 */

import { getSecurityMonitor } from '../utils/SecurityMonitor';
import { getAdvancedPerformanceMonitor } from '../utils/AdvancedPerformanceMonitor';
import { getPerformanceMonitor } from '../utils/PerformanceMonitor';

export interface DashboardConfig {
  enabled: boolean;
  updateInterval: number; // ms
  maxHistoryPoints: number;
  autoRefresh: boolean;
  notifications: {
    enabled: boolean;
    criticalOnly: boolean;
    sound: boolean;
  };
  panels: {
    security: boolean;
    performance: boolean;
    resources: boolean;
    user: boolean;
  };
}

export interface DashboardData {
  timestamp: string;
  security: {
    threats: number;
    blocked: number;
    cspViolations: number;
    suspiciousActivity: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  performance: {
    score: number;
    loadTime: number;
    memoryUsage: number;
    errorRate: number;
    budgetCompliance: number;
  };
  resources: {
    totalRequests: number;
    cachedRequests: number;
    failedRequests: number;
    averageSize: number;
    compression: number;
  };
  user: {
    activeUsers: number;
    sessionDuration: number;
    interactions: number;
    bounceRate: number;
    conversionRate: number;
  };
}

export class MonitoringDashboard {
  private static instance: MonitoringDashboard;
  private config: DashboardConfig;
  private securityMonitor = getSecurityMonitor();
  private performanceMonitor = getPerformanceMonitor();
  private advancedPerformanceMonitor = getAdvancedPerformanceMonitor();
  private history: DashboardData[] = [];
  private updateTimer?: number;
  private isVisible = false;
  
  private constructor(config?: Partial<DashboardConfig>) {
    this.config = {
      enabled: true,
      updateInterval: 30000, // 30 seconds
      maxHistoryPoints: 100,
      autoRefresh: true,
      notifications: {
        enabled: true,
        criticalOnly: true,
        sound: false
      },
      panels: {
        security: true,
        performance: true,
        resources: true,
        user: true
      },
      ...config
    };
    
    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initializeDashboard();
    }
  }
  
  static getInstance(config?: Partial<DashboardConfig>): MonitoringDashboard {
    if (!MonitoringDashboard.instance) {
      MonitoringDashboard.instance = new MonitoringDashboard(config);
    }
    return MonitoringDashboard.instance;
  }
  
  /**
   * Initialize dashboard
   */
  private initializeDashboard(): void {
    this.createDashboardUI();
    this.setupKeyboardShortcuts();
    this.startDataCollection();
    
    console.log('📊 Monitoring dashboard initialized - Press Ctrl+Shift+M to toggle');
  }
  
  /**
   * Create dashboard UI
   */
  private createDashboardUI(): void {
    const dashboard = document.createElement('div');
    dashboard.id = 'monitoring-dashboard';
    dashboard.innerHTML = this.getDashboardHTML();
    dashboard.style.cssText = this.getDashboardCSS();
    
    document.body.appendChild(dashboard);
    
    // Add event listeners
    this.setupDashboardEvents(dashboard);
  }
  
  /**
   * Get dashboard HTML
   */
  private getDashboardHTML(): string {
    return `
      <div class="dashboard-header">
        <h2>🔍 System Monitoring Dashboard</h2>
        <div class="dashboard-controls">
          <button id="refresh-btn" title="Refresh Data">🔄</button>
          <button id="export-btn" title="Export Data">💾</button>
          <button id="settings-btn" title="Settings">⚙️</button>
          <button id="close-btn" title="Close">✕</button>
        </div>
      </div>
      
      <div class="dashboard-content">
        ${this.config.panels.security ? this.getSecurityPanelHTML() : ''}
        ${this.config.panels.performance ? this.getPerformancePanelHTML() : ''}
        ${this.config.panels.resources ? this.getResourcesPanelHTML() : ''}
        ${this.config.panels.user ? this.getUserPanelHTML() : ''}
      </div>
      
      <div class="dashboard-footer">
        <div class="last-updated">Last updated: <span id="last-updated-time">Never</span></div>
        <div class="auto-refresh">
          <label>
            <input type="checkbox" id="auto-refresh" ${this.config.autoRefresh ? 'checked' : ''}>
            Auto-refresh (${this.config.updateInterval / 1000}s)
          </label>
        </div>
      </div>
    `;
  }
  
  /**
   * Get security panel HTML
   */
  private getSecurityPanelHTML(): string {
    return `
      <div class="dashboard-panel security-panel">
        <h3>🔒 Security Monitor</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Threat Level</div>
            <div class="metric-value" id="threat-level">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Blocked Requests</div>
            <div class="metric-value" id="blocked-requests">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">CSP Violations</div>
            <div class="metric-value" id="csp-violations">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Suspicious Activity</div>
            <div class="metric-value" id="suspicious-activity">-</div>
          </div>
        </div>
        <div class="recent-events">
          <h4>Recent Security Events</h4>
          <ul id="security-events"></ul>
        </div>
      </div>
    `;
  }
  
  /**
   * Get performance panel HTML
   */
  private getPerformancePanelHTML(): string {
    return `
      <div class="dashboard-panel performance-panel">
        <h3>⚡ Performance Monitor</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Performance Score</div>
            <div class="metric-value" id="performance-score">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Load Time</div>
            <div class="metric-value" id="load-time">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Memory Usage</div>
            <div class="metric-value" id="memory-usage">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Error Rate</div>
            <div class="metric-value" id="error-rate">-</div>
          </div>
        </div>
        <div class="performance-chart">
          <canvas id="performance-chart" width="400" height="200"></canvas>
        </div>
      </div>
    `;
  }
  
  /**
   * Get resources panel HTML
   */
  private getResourcesPanelHTML(): string {
    return `
      <div class="dashboard-panel resources-panel">
        <h3>📦 Resource Monitor</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Total Requests</div>
            <div class="metric-value" id="total-requests">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Cache Hit Rate</div>
            <div class="metric-value" id="cache-hit-rate">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Failed Requests</div>
            <div class="metric-value" id="failed-requests">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Compression</div>
            <div class="metric-value" id="compression-ratio">-</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get user panel HTML
   */
  private getUserPanelHTML(): string {
    return `
      <div class="dashboard-panel user-panel">
        <h3>👤 User Analytics</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Session Duration</div>
            <div class="metric-value" id="session-duration">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Interactions</div>
            <div class="metric-value" id="user-interactions">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Bounce Rate</div>
            <div class="metric-value" id="bounce-rate">-</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Conversion Rate</div>
            <div class="metric-value" id="conversion-rate">-</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get dashboard CSS
   */
  private getDashboardCSS(): string {
    return `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 800px;
      height: 600px;
      background: rgba(0, 0, 0, 0.95);
      color: #fff;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 999999;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: none;
      overflow: hidden;
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #333;
        background: #1a1a1a;
      }
      
      .dashboard-header h2 {
        margin: 0;
        font-size: 16px;
        color: #00ff00;
      }
      
      .dashboard-controls {
        display: flex;
        gap: 10px;
      }
      
      .dashboard-controls button {
        background: #333;
        border: 1px solid #555;
        color: #fff;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .dashboard-controls button:hover {
        background: #555;
      }
      
      .dashboard-content {
        padding: 20px;
        height: calc(100% - 120px);
        overflow-y: auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .dashboard-panel {
        background: #1f1f1f;
        border: 1px solid #333;
        border-radius: 6px;
        padding: 15px;
      }
      
      .dashboard-panel h3 {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: #00ff00;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .metric-item {
        text-align: center;
      }
      
      .metric-label {
        font-size: 10px;
        color: #888;
        margin-bottom: 2px;
      }
      
      .metric-value {
        font-size: 16px;
        font-weight: bold;
        color: #00ff00;
      }
      
      .metric-value.warning {
        color: #ffaa00;
      }
      
      .metric-value.error {
        color: #ff4444;
      }
      
      .metric-value.critical {
        color: #ff0000;
        animation: blink 1s infinite;
      }
      
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.5; }
      }
      
      .recent-events {
        font-size: 10px;
      }
      
      .recent-events h4 {
        margin: 0 0 10px 0;
        font-size: 12px;
        color: #ccc;
      }
      
      .recent-events ul {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 100px;
        overflow-y: auto;
      }
      
      .recent-events li {
        padding: 2px 0;
        border-bottom: 1px solid #2a2a2a;
        font-size: 9px;
      }
      
      .dashboard-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        border-top: 1px solid #333;
        background: #1a1a1a;
        font-size: 10px;
        color: #888;
      }
      
      .performance-chart {
        margin-top: 10px;
      }
      
      #performance-chart {
        width: 100%;
        max-height: 120px;
        background: #2a2a2a;
        border-radius: 4px;
      }
    `;
  }
  
  /**
   * Setup dashboard events
   */
  private setupDashboardEvents(dashboard: HTMLElement): void {
    // Close button
    dashboard.querySelector('#close-btn')?.addEventListener('click', () => {
      this.hideDashboard();
    });
    
    // Refresh button
    dashboard.querySelector('#refresh-btn')?.addEventListener('click', () => {
      this.updateDashboard();
    });
    
    // Export button
    dashboard.querySelector('#export-btn')?.addEventListener('click', () => {
      this.exportData();
    });
    
    // Auto-refresh toggle
    dashboard.querySelector('#auto-refresh')?.addEventListener('change', (e) => {
      this.config.autoRefresh = (e.target as HTMLInputElement).checked;
      if (this.config.autoRefresh) {
        this.startDataCollection();
      } else {
        this.stopDataCollection();
      }
    });
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+M to toggle dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        this.toggleDashboard();
      }
      
      // Escape to close dashboard
      if (e.key === 'Escape' && this.isVisible) {
        this.hideDashboard();
      }
    });
  }
  
  /**
   * Start data collection
   */
  private startDataCollection(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    if (this.config.autoRefresh) {
      this.updateTimer = window.setInterval(() => {
        this.updateDashboard();
      }, this.config.updateInterval);
    }
    
    // Initial update
    this.updateDashboard();
  }
  
  /**
   * Stop data collection
   */
  private stopDataCollection(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }
  
  /**
   * Update dashboard with current data
   */
  private updateDashboard(): void {
    const data = this.collectCurrentData();
    this.history.push(data);
    
    // Keep history within limits
    if (this.history.length > this.config.maxHistoryPoints) {
      this.history = this.history.slice(-this.config.maxHistoryPoints);
    }
    
    this.updateUI(data);
    this.updateLastUpdatedTime();
  }
  
  /**
   * Collect current monitoring data
   */
  private collectCurrentData(): DashboardData {
    const securityMetrics = this.securityMonitor.getMetrics();
    const securityEvents = this.securityMonitor.getEvents(10);
    const advancedMetrics = this.advancedPerformanceMonitor.getAdvancedMetrics();
    const baseMetrics = this.performanceMonitor.calculateMetrics();
    
    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (securityMetrics.suspiciousPatterns > 10 || securityMetrics.cspViolations > 20) {
      riskLevel = 'critical';
    } else if (securityMetrics.suspiciousPatterns > 5 || securityMetrics.cspViolations > 10) {
      riskLevel = 'high';
    } else if (securityMetrics.suspiciousPatterns > 2 || securityMetrics.cspViolations > 5) {
      riskLevel = 'medium';
    }
    
    return {
      timestamp: new Date().toISOString(),
      security: {
        threats: securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length,
        blocked: securityMetrics.blockedRequests,
        cspViolations: securityMetrics.cspViolations,
        suspiciousActivity: securityMetrics.suspiciousPatterns,
        riskLevel
      },
      performance: {
        score: advancedMetrics.budgetCompliance.totalScore,
        loadTime: advancedMetrics.realUserMetrics.averageLoadTime,
        memoryUsage: advancedMetrics.memoryUsage.percentage,
        errorRate: advancedMetrics.realUserMetrics.errorRate,
        budgetCompliance: advancedMetrics.budgetCompliance.totalScore
      },
      resources: {
        totalRequests: baseMetrics.bundlesLoaded + baseMetrics.modulesLoaded,
        cachedRequests: Math.floor(baseMetrics.cacheHitRate / 100 * (baseMetrics.bundlesLoaded + baseMetrics.modulesLoaded)),
        failedRequests: Math.floor(baseMetrics.errorRate / 100 * (baseMetrics.bundlesLoaded + baseMetrics.modulesLoaded)),
        averageSize: baseMetrics.actualLoadedSize / (baseMetrics.bundlesLoaded || 1),
        compression: ((baseMetrics.estimatedBundleSize - baseMetrics.actualLoadedSize) / baseMetrics.estimatedBundleSize) * 100
      },
      user: {
        activeUsers: 1, // Current session
        sessionDuration: advancedMetrics.userEngagement.sessionDuration,
        interactions: advancedMetrics.userEngagement.interactions,
        bounceRate: advancedMetrics.userEngagement.bounceRate,
        conversionRate: advancedMetrics.realUserMetrics.conversionRate
      }
    };
  }
  
  /**
   * Update UI with new data
   */
  private updateUI(data: DashboardData): void {
    // Update security panel
    this.updateElement('threat-level', data.security.riskLevel.toUpperCase(), this.getRiskLevelClass(data.security.riskLevel));
    this.updateElement('blocked-requests', data.security.blocked.toString());
    this.updateElement('csp-violations', data.security.cspViolations.toString());
    this.updateElement('suspicious-activity', data.security.suspiciousActivity.toString());
    
    // Update performance panel
    this.updateElement('performance-score', `${data.performance.score.toFixed(1)}/100`, this.getScoreClass(data.performance.score));
    this.updateElement('load-time', `${data.performance.loadTime.toFixed(0)}ms`);
    this.updateElement('memory-usage', `${data.performance.memoryUsage.toFixed(1)}%`, this.getMemoryClass(data.performance.memoryUsage));
    this.updateElement('error-rate', `${data.performance.errorRate.toFixed(1)}%`, this.getErrorRateClass(data.performance.errorRate));
    
    // Update resources panel
    this.updateElement('total-requests', data.resources.totalRequests.toString());
    this.updateElement('cache-hit-rate', `${((data.resources.cachedRequests / data.resources.totalRequests) * 100).toFixed(1)}%`);
    this.updateElement('failed-requests', data.resources.failedRequests.toString());
    this.updateElement('compression-ratio', `${data.resources.compression.toFixed(1)}%`);
    
    // Update user panel
    this.updateElement('session-duration', `${(data.user.sessionDuration / 1000).toFixed(0)}s`);
    this.updateElement('user-interactions', data.user.interactions.toString());
    this.updateElement('bounce-rate', `${data.user.bounceRate.toFixed(1)}%`);
    this.updateElement('conversion-rate', `${data.user.conversionRate.toFixed(1)}%`);
    
    // Update security events
    this.updateSecurityEvents();
  }
  
  /**
   * Update element content and class
   */
  private updateElement(id: string, content: string, className?: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
      if (className) {
        element.className = `metric-value ${className}`;
      }
    }
  }
  
  /**
   * Update security events list
   */
  private updateSecurityEvents(): void {
    const eventsList = document.getElementById('security-events');
    if (!eventsList) return;
    
    const events = this.securityMonitor.getEvents(5);
    eventsList.innerHTML = events.map(event => 
      `<li>${new Date(event.timestamp).toLocaleTimeString()} - ${event.type}: ${event.data?.reason || 'N/A'}</li>`
    ).join('');
  }
  
  /**
   * Get CSS class for risk level
   */
  private getRiskLevelClass(level: string): string {
    switch (level) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return '';
    }
  }
  
  /**
   * Get CSS class for score
   */
  private getScoreClass(score: number): string {
    if (score < 50) return 'error';
    if (score < 75) return 'warning';
    return '';
  }
  
  /**
   * Get CSS class for memory usage
   */
  private getMemoryClass(usage: number): string {
    if (usage > 90) return 'critical';
    if (usage > 75) return 'error';
    if (usage > 60) return 'warning';
    return '';
  }
  
  /**
   * Get CSS class for error rate
   */
  private getErrorRateClass(rate: number): string {
    if (rate > 10) return 'critical';
    if (rate > 5) return 'error';
    if (rate > 2) return 'warning';
    return '';
  }
  
  /**
   * Update last updated time
   */
  private updateLastUpdatedTime(): void {
    const element = document.getElementById('last-updated-time');
    if (element) {
      element.textContent = new Date().toLocaleTimeString();
    }
  }
  
  /**
   * Export dashboard data
   */
  private exportData(): void {
    const exportData = {
      config: this.config,
      history: this.history,
      securityReport: this.securityMonitor.generateSecurityReport(),
      performanceReport: this.advancedPerformanceMonitor.generateAdvancedReport()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-report-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * Show dashboard
   */
  showDashboard(): void {
    const dashboard = document.getElementById('monitoring-dashboard');
    if (dashboard) {
      dashboard.style.display = 'block';
      this.isVisible = true;
      this.startDataCollection();
    }
  }
  
  /**
   * Hide dashboard
   */
  hideDashboard(): void {
    const dashboard = document.getElementById('monitoring-dashboard');
    if (dashboard) {
      dashboard.style.display = 'none';
      this.isVisible = false;
      this.stopDataCollection();
    }
  }
  
  /**
   * Toggle dashboard visibility
   */
  toggleDashboard(): void {
    if (this.isVisible) {
      this.hideDashboard();
    } else {
      this.showDashboard();
    }
  }
  
  /**
   * Get dashboard history
   */
  getHistory(): DashboardData[] {
    return [...this.history];
  }
  
  /**
   * Clear dashboard history
   */
  clearHistory(): void {
    this.history = [];
  }
}

// Global instance management
let globalDashboard: MonitoringDashboard;

export function initMonitoringDashboard(config?: Partial<DashboardConfig>): MonitoringDashboard {
  if (!globalDashboard) {
    globalDashboard = MonitoringDashboard.getInstance(config);
  }
  return globalDashboard;
}

export function getMonitoringDashboard(): MonitoringDashboard {
  if (!globalDashboard) {
    globalDashboard = MonitoringDashboard.getInstance();
  }
  return globalDashboard;
}

// Auto-initialize dashboard
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMonitoringDashboard();
    });
  } else {
    initMonitoringDashboard();
  }
}
