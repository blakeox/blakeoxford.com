/**
 * Real-time Threat Intelligence & Activity Monitor
 * Advanced threat detection and behavioral analysis system
 */
import { getSecurityMonitor } from './SecurityMonitor';
import { createModuleErrorReporter } from './ModuleErrorHandling';

export interface ThreatIntelligence {
  id: string;
  timestamp: number;
  threatType: 'malicious_ip' | 'suspicious_pattern' | 'anomalous_behavior' | 'bot_activity' | 'attack_signature';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  source: string;
  description: string;
  indicators: string[];
  actions: string[];
  relatedEvents: string[];
}

export interface ActivityPattern {
  id: string;
  pattern: string;
  description: string;
  riskScore: number; // 0-100
  frequency: number;
  lastSeen: number;
  blocked: boolean;
}

export interface UserBehaviorProfile {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  startTime: number;
  pageViews: number;
  interactions: number;
  timeSpent: number;
  suspiciousActions: number;
  riskScore: number; // 0-100
  patterns: string[];
}

export interface RealTimeAlert {
  id: string;
  timestamp: number;
  alertType: 'threat_detected' | 'anomaly_detected' | 'attack_in_progress' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedSystems: string[];
  recommendedActions: string[];
  autoBlocked: boolean;
}

export class ThreatIntelligenceMonitor {
  private threats: Map<string, ThreatIntelligence> = new Map();
  private activityPatterns: Map<string, ActivityPattern> = new Map();
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private alerts: RealTimeAlert[] = [];
  private errorReporter = createModuleErrorReporter('ThreatIntelligenceMonitor');
  private isMonitoring = false;
  private analysisInterval?: number;

  // Threat detection patterns
  private maliciousPatterns = [
    /\b(?:select|union|insert|delete|drop|create|alter|exec|execute)\b.*\b(?:from|into|table|database)\b/i,
    /<script[^>]*>.*?<\/script>/i,
    /javascript:\s*(?:void\(0\)|alert\(|eval\()/i,
    /(?:\.\.\/){3,}/,
    /\b(?:cmd|powershell|bash|sh)\s+/i,
    /(?:document\.cookie|localStorage|sessionStorage)/i
  ];

  private suspiciousUserAgents = [
    /bot|crawler|spider|scraper|scanner/i,
    /sqlmap|nikto|burp|netsparker|acunetix/i,
    /nmap|masscan|zmap/i,
    /curl|wget|httpie/i,
    /python-requests|go-http-client/i
  ];

  constructor() {
    this.initializePatterns();
    this.startMonitoring();
  }

  /**
   * Initialize known threat patterns
   */
  private initializePatterns(): void {
    // SQL Injection patterns
    this.addActivityPattern({
      id: 'sql_injection',
      pattern: 'SELECT|UNION|INSERT|DELETE|DROP|CREATE|ALTER',
      description: 'Potential SQL injection attempt',
      riskScore: 90,
      frequency: 0,
      lastSeen: 0,
      blocked: true
    });

    // XSS patterns
    this.addActivityPattern({
      id: 'xss_script',
      pattern: '<script>|javascript:|onload=|onerror=',
      description: 'Cross-site scripting attempt',
      riskScore: 85,
      frequency: 0,
      lastSeen: 0,
      blocked: true
    });

    // Directory traversal
    this.addActivityPattern({
      id: 'directory_traversal',
      pattern: '../../../|..\\..\\..\\',
      description: 'Directory traversal attempt',
      riskScore: 80,
      frequency: 0,
      lastSeen: 0,
      blocked: true
    });

    // Command injection
    this.addActivityPattern({
      id: 'command_injection',
      pattern: 'cmd|powershell|bash|sh|exec',
      description: 'Command injection attempt',
      riskScore: 95,
      frequency: 0,
      lastSeen: 0,
      blocked: true
    });

    // Reconnaissance patterns
    this.addActivityPattern({
      id: 'reconnaissance',
      pattern: 'admin|config|backup|test|dev',
      description: 'Potential reconnaissance activity',
      riskScore: 60,
      frequency: 0,
      lastSeen: 0,
      blocked: false
    });
  }

  /**
   * Start threat intelligence monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.setupEventListeners();
    this.setupPeriodicAnalysis();
    this.isMonitoring = true;

    console.log('🛡️ Threat Intelligence Monitor started');
  }

  /**
   * Setup event listeners for real-time monitoring
   */
  private setupEventListeners(): void {
    // Monitor all form inputs for malicious patterns
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'text' || target.type === 'email' || target.tagName === 'TEXTAREA') {
        this.analyzeInputData(target.value, target.name || target.id || 'unknown');
      }
    });

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      this.analyzeFetchRequest(url.toString(), options);
      return originalFetch(...args);
    };

    // Monitor navigation patterns
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.analyzeNavigation(args[2] as string);
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.analyzeNavigation(args[2] as string);
      return originalReplaceState.apply(history, args);
    };

    // Monitor user behavior patterns
    this.trackUserBehavior();
  }

  /**
   * Setup periodic threat analysis
   */
  private setupPeriodicAnalysis(): void {
    this.analysisInterval = window.setInterval(() => {
      this.performThreatAnalysis();
      this.analyzeUserBehaviorPatterns();
      this.generateRealTimeAlerts();
    }, 30000) as unknown as number; // Every 30 seconds
  }

  /**
   * Analyze input data for threats
   */
  private analyzeInputData(value: string, fieldName: string): void {
    const threats: ThreatIntelligence[] = [];

    // Check for malicious patterns
    this.maliciousPatterns.forEach((pattern, index) => {
      if (pattern.test(value)) {
        const threat = this.createThreatIntelligence({
          threatType: 'attack_signature',
          severity: 'high',
          confidence: 85,
          source: 'input_analysis',
          description: `Malicious pattern detected in form field: ${fieldName}`,
          indicators: [pattern.toString(), value.substring(0, 100)],
          actions: ['Block input', 'Log security event', 'Analyze user session']
        });
        threats.push(threat);

        // Update pattern frequency
        const patternId = `malicious_pattern_${index}`;
        this.updatePatternFrequency(patternId);
      }
    });

    // Store threats
    threats.forEach(threat => this.threats.set(threat.id, threat));

    // Generate alerts for high-severity threats
    threats.filter(t => t.severity === 'high' || t.severity === 'critical')
           .forEach(threat => this.createAlert(threat));
  }

  /**
   * Analyze fetch requests for threats
   */
  private analyzeFetchRequest(url: string, options?: RequestInit): void {
    // Check for suspicious request patterns
    const suspiciousUrls = [
      '/admin', '/config', '/backup', '/test', '/dev',
      '/.env', '/wp-admin', '/phpmyadmin'
    ];

    const isSuspicious = suspiciousUrls.some(pattern => url.includes(pattern));
    
    if (isSuspicious) {
      const threat = this.createThreatIntelligence({
        threatType: 'suspicious_pattern',
        severity: 'medium',
        confidence: 70,
        source: 'fetch_analysis',
        description: `Suspicious URL accessed: ${url}`,
        indicators: [url],
        actions: ['Monitor user session', 'Log access attempt']
      });

      this.threats.set(threat.id, threat);
    }

    // Analyze request headers for bot signatures
    if (options?.headers) {
      const headers = new Headers(options.headers);
      const userAgent = headers.get('user-agent') || '';
      
      if (this.isSuspiciousUserAgent(userAgent)) {
        const threat = this.createThreatIntelligence({
          threatType: 'bot_activity',
          severity: 'medium',
          confidence: 80,
          source: 'user_agent_analysis',
          description: `Suspicious user agent detected: ${userAgent}`,
          indicators: [userAgent],
          actions: ['Rate limit user', 'Increase monitoring']
        });

        this.threats.set(threat.id, threat);
      }
    }
  }

  /**
   * Analyze navigation patterns
   */
  private analyzeNavigation(url: string): void {
    if (!url) return;

    // Check for rapid navigation (potential bot behavior)
    const sessionId = this.getSessionId();
    const profile = this.userProfiles.get(sessionId);
    
    if (profile) {
      profile.pageViews++;
      
      // Calculate navigation rate
      const timeSpent = Date.now() - profile.startTime;
      const navigationRate = profile.pageViews / (timeSpent / 1000); // pages per second
      
      if (navigationRate > 2) { // More than 2 pages per second
        const threat = this.createThreatIntelligence({
          threatType: 'anomalous_behavior',
          severity: 'medium',
          confidence: 75,
          source: 'navigation_analysis',
          description: `Rapid navigation detected: ${navigationRate.toFixed(2)} pages/sec`,
          indicators: [`navigation_rate:${navigationRate}`, `session:${sessionId}`],
          actions: ['Rate limit session', 'Require CAPTCHA']
        });

        this.threats.set(threat.id, threat);
        profile.suspiciousActions++;
        profile.riskScore = Math.min(100, profile.riskScore + 20);
      }
    }
  }

  /**
   * Track user behavior patterns
   */
  private trackUserBehavior(): void {
    const sessionId = this.getSessionId();
    const userAgent = navigator.userAgent;
    const ipAddress = 'unknown'; // Would be available server-side

    // Initialize or update user profile
    let profile = this.userProfiles.get(sessionId);
    if (!profile) {
      profile = {
        sessionId,
        ipAddress,
        userAgent,
        startTime: Date.now(),
        pageViews: 1,
        interactions: 0,
        timeSpent: 0,
        suspiciousActions: 0,
        riskScore: 0,
        patterns: []
      };
      this.userProfiles.set(sessionId, profile);
    }

    // Track interactions
    document.addEventListener('click', () => {
      if (profile) {
        profile.interactions++;
      }
    });

    // Update time spent
    setInterval(() => {
      if (profile) {
        profile.timeSpent = Date.now() - profile.startTime;
      }
    }, 1000);
  }

  /**
   * Perform comprehensive threat analysis
   */
  private performThreatAnalysis(): void {
    const securityMonitor = getSecurityMonitor();
    const securityEvents = securityMonitor.getEvents(50);
    
    // Analyze recent security events for threat patterns
    const recentThreats = securityEvents.filter(event => 
      Date.now() - event.timestamp < 300000 // Last 5 minutes
    );

    // Look for attack patterns
    const attackTypes = new Map<string, number>();
    recentThreats.forEach(event => {
      const count = attackTypes.get(event.type) || 0;
      attackTypes.set(event.type, count + 1);
    });

    // Generate threat intelligence for coordinated attacks
    attackTypes.forEach((count, type) => {
      if (count >= 5) { // 5 or more similar events
        const threat = this.createThreatIntelligence({
          threatType: 'attack_signature',
          severity: count >= 10 ? 'critical' : 'high',
          confidence: 90,
          source: 'pattern_analysis',
          description: `Coordinated attack detected: ${count} ${type} events`,
          indicators: [`event_type:${type}`, `frequency:${count}`],
          actions: ['Block source', 'Increase monitoring', 'Alert security team']
        });

        this.threats.set(threat.id, threat);
        this.createAlert(threat);
      }
    });
  }

  /**
   * Analyze user behavior patterns for anomalies
   */
  private analyzeUserBehaviorPatterns(): void {
    this.userProfiles.forEach((profile) => {
      const timeSpentMinutes = profile.timeSpent / (1000 * 60);
      const interactionRate = timeSpentMinutes > 0 ? profile.interactions / timeSpentMinutes : 0;
      
      // Detect anomalous behavior
      let anomalies = 0;
      const anomalyReasons: string[] = [];

      // Too many page views, too few interactions
      if (profile.pageViews > 10 && interactionRate < 0.5) {
        anomalies++;
        anomalyReasons.push('Low interaction rate for page views');
      }

      // Rapid page views
      if (profile.pageViews > 20 && timeSpentMinutes < 2) {
        anomalies++;
        anomalyReasons.push('Rapid page navigation');
      }

      // Suspicious user agent
      if (this.isSuspiciousUserAgent(profile.userAgent)) {
        anomalies++;
        anomalyReasons.push('Suspicious user agent');
      }

      // Update risk score
      profile.riskScore = Math.min(100, anomalies * 25);

      // Generate threat intelligence for high-risk profiles
      if (profile.riskScore >= 75) {
        const threat = this.createThreatIntelligence({
          threatType: 'anomalous_behavior',
          severity: profile.riskScore >= 90 ? 'high' : 'medium',
          confidence: 80,
          source: 'behavior_analysis',
          description: `Anomalous user behavior detected (Risk: ${profile.riskScore})`,
          indicators: anomalyReasons,
          actions: ['Increase monitoring', 'Require additional verification']
        });

        this.threats.set(threat.id, threat);
      }
    });
  }

  /**
   * Generate real-time alerts
   */
  private generateRealTimeAlerts(): void {
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => Date.now() - threat.timestamp < 60000) // Last minute
      .filter(threat => threat.severity === 'high' || threat.severity === 'critical');

    recentThreats.forEach(threat => {
      if (!this.alerts.some(alert => alert.description.includes(threat.id))) {
        this.createAlert(threat);
      }
    });
  }

  /**
   * Create threat intelligence entry
   */
  private createThreatIntelligence(params: {
    threatType: ThreatIntelligence['threatType'];
    severity: ThreatIntelligence['severity'];
    confidence: number;
    source: string;
    description: string;
    indicators: string[];
    actions: string[];
  }): ThreatIntelligence {
    return {
      id: this.generateThreatId(),
      timestamp: Date.now(),
      relatedEvents: [],
      ...params
    };
  }

  /**
   * Create real-time alert
   */
  private createAlert(threat: ThreatIntelligence): void {
    const alert: RealTimeAlert = {
      id: this.generateAlertId(),
      timestamp: Date.now(),
      alertType: 'threat_detected',
      severity: threat.severity === 'critical' ? 'critical' : 
                threat.severity === 'high' ? 'high' : 'medium',
      title: `${threat.threatType.replace('_', ' ').toUpperCase()} Detected`,
      description: threat.description,
      affectedSystems: ['web_application'],
      recommendedActions: threat.actions,
      autoBlocked: threat.severity === 'critical'
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      console.error('🚨 CRITICAL THREAT DETECTED:', alert);
    } else {
      console.warn('⚠️ Threat Alert:', alert);
    }

    // Send to analytics if available
    if (window.analytics && 'track' in window.analytics) {
      (window.analytics as any).track('threat_alert', {
        alertType: alert.alertType,
        severity: alert.severity,
        threatType: threat.threatType,
        confidence: threat.confidence
      });
    }
  }

  /**
   * Add activity pattern
   */
  private addActivityPattern(pattern: ActivityPattern): void {
    this.activityPatterns.set(pattern.id, pattern);
  }

  /**
   * Update pattern frequency
   */
  private updatePatternFrequency(patternId: string): void {
    const pattern = this.activityPatterns.get(patternId);
    if (pattern) {
      pattern.frequency++;
      pattern.lastSeen = Date.now();
    }
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    return this.suspiciousUserAgents.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('threat_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('threat_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Generate unique threat ID
   */
  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get threat intelligence summary
   */
  getThreatSummary(): {
    totalThreats: number;
    criticalThreats: number;
    highThreats: number;
    recentThreats: number;
    topThreatTypes: Array<{ type: string; count: number }>;
    riskScore: number;
  } {
    const threats = Array.from(this.threats.values());
    const recentThreats = threats.filter(t => Date.now() - t.timestamp < 3600000); // Last hour
    
    const threatTypes = new Map<string, number>();
    threats.forEach(threat => {
      const count = threatTypes.get(threat.threatType) || 0;
      threatTypes.set(threat.threatType, count + 1);
    });

    const topThreatTypes = Array.from(threatTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const criticalCount = threats.filter(t => t.severity === 'critical').length;
    const highCount = threats.filter(t => t.severity === 'high').length;
    
    // Calculate overall risk score
    const riskScore = Math.min(100, 
      (criticalCount * 20) + 
      (highCount * 10) + 
      (recentThreats.length * 2)
    );

    return {
      totalThreats: threats.length,
      criticalThreats: criticalCount,
      highThreats: highCount,
      recentThreats: recentThreats.length,
      topThreatTypes,
      riskScore
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10): RealTimeAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get user behavior profiles
   */
  getUserProfiles(): UserBehaviorProfile[] {
    return Array.from(this.userProfiles.values());
  }

  /**
   * Export threat intelligence data
   */
  exportThreatData(): string {
    return JSON.stringify({
      threats: Array.from(this.threats.values()),
      patterns: Array.from(this.activityPatterns.values()),
      userProfiles: Array.from(this.userProfiles.values()),
      alerts: this.alerts,
      summary: this.getThreatSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.analysisInterval) {
      window.clearInterval(this.analysisInterval);
      this.analysisInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🛡️ Threat Intelligence Monitor stopped');
  }
}

// Export singleton instance
export const threatIntelligenceMonitor = new ThreatIntelligenceMonitor();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).threatIntelligenceMonitor = threatIntelligenceMonitor;
}
