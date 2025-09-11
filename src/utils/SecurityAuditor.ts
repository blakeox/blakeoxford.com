/**
 * Automated Security Audit & Health Check System
 * Comprehensive security assessment with actionable recommendations
 */
import { getSecurityMonitor } from './SecurityMonitor';
import { complianceDashboard } from './ComplianceDashboard';
import { threatIntelligenceMonitor } from './ThreatIntelligenceMonitor';
import { performanceSecurityAnalyzer } from './PerformanceSecurityAnalyzer';
import { createModuleErrorReporter } from './ModuleErrorHandling';

export interface SecurityAuditResult {
  id: string;
  timestamp: number;
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: {
    infrastructure: SecurityCategoryResult;
    application: SecurityCategoryResult;
    compliance: SecurityCategoryResult;
    monitoring: SecurityCategoryResult;
    incident_response: SecurityCategoryResult;
  };
  criticalFindings: SecurityFinding[];
  recommendations: SecurityRecommendation[];
  trends: {
    previousScore: number;
    improvement: number;
    deterioration: number;
  };
}

export interface SecurityCategoryResult {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  findings: SecurityFinding[];
  weight: number; // Category importance weight
}

export interface SecurityFinding {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  evidence: string[];
  impact: string;
  likelihood: 'low' | 'medium' | 'high';
  cvssScore?: number;
  cwe?: string[]; // Common Weakness Enumeration
  references: string[];
}

export interface SecurityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    cost: 'low' | 'medium' | 'high';
    dependencies: string[];
  };
  impact: {
    security: number; // 0-100
    performance: number; // -100 to 100 (negative = degradation)
    usability: number; // -100 to 100
  };
}

export interface HealthCheckResult {
  timestamp: number;
  systemHealth: {
    overall: number; // 0-100
    security: number;
    performance: number;
    availability: number;
    reliability: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    responseTime: number;
    errorRate: number;
    lastCheck: number;
  }[];
  recommendations: string[];
}

export class SecurityAuditor {
  private auditResults: SecurityAuditResult[] = [];
  private healthChecks: HealthCheckResult[] = [];
  private errorReporter = createModuleErrorReporter('SecurityAuditor');
  private isAuditing = false;
  private auditInterval?: number;

  constructor() {
    this.scheduleRegularAudits();
  }

  /**
   * Perform comprehensive security audit
   */
  async performSecurityAudit(): Promise<SecurityAuditResult> {
    console.log('🔍 Starting comprehensive security audit...');
    
    const timestamp = Date.now();
    const auditId = this.generateAuditId();

    try {
      // Gather data from all monitoring systems
      const securityMetrics = getSecurityMonitor().getMetrics();
      const complianceReport = await complianceDashboard.runAllChecks();
      const threatSummary = threatIntelligenceMonitor.getThreatSummary();
      const correlationSummary = performanceSecurityAnalyzer.getCorrelationSummary();

      // Perform category-specific audits
      const infrastructure = await this.auditInfrastructure();
      const application = await this.auditApplication();
      const compliance = await this.auditCompliance(complianceReport);
      const monitoring = await this.auditMonitoring(securityMetrics, threatSummary);
      const incidentResponse = await this.auditIncidentResponse();

      // Calculate overall score
      const categories = { infrastructure, application, compliance, monitoring, incident_response: incidentResponse };
      const overallScore = this.calculateOverallScore(categories);
      const riskLevel = this.determineRiskLevel(overallScore);

      // Collect critical findings
      const criticalFindings = this.collectCriticalFindings(categories);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(categories, correlationSummary);

      // Calculate trends
      const trends = this.calculateTrends(overallScore);

      const auditResult: SecurityAuditResult = {
        id: auditId,
        timestamp,
        overallScore,
        riskLevel,
        categories,
        criticalFindings,
        recommendations,
        trends
      };

      this.auditResults.push(auditResult);
      
      // Keep only last 10 audits
      if (this.auditResults.length > 10) {
        this.auditResults = this.auditResults.slice(-10);
      }

      console.log(`✅ Security audit completed. Overall score: ${overallScore}/100 (${riskLevel})`);
      return auditResult;

    } catch (error) {
      this.errorReporter.reportError(
        'SECURITY_AUDIT_FAILED',
        'Security audit execution failed',
        'high' as any,
        {
          component: 'SecurityAudit',
          additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );

      throw error;
    }
  }

  /**
   * Audit infrastructure security
   */
  private async auditInfrastructure(): Promise<SecurityCategoryResult> {
    const findings: SecurityFinding[] = [];

    // Check HTTPS configuration
    const isHTTPS = window.location.protocol === 'https:';
    if (!isHTTPS) {
      findings.push({
        id: 'infra-https-missing',
        severity: 'critical',
        category: 'infrastructure',
        title: 'HTTPS Not Enforced',
        description: 'Site is not using HTTPS encryption',
        evidence: [`Protocol: ${window.location.protocol}`],
        impact: 'Data transmitted in clear text, vulnerable to interception',
        likelihood: 'high',
        cvssScore: 7.5,
        cwe: ['CWE-319'],
        references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure']
      });
    }

    // Check security headers
    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const headers = Object.fromEntries(response.headers.entries());
      
      const securityHeaders = [
        'content-security-policy',
        'strict-transport-security',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy'
      ];

      securityHeaders.forEach(header => {
        if (!headers[header]) {
          findings.push({
            id: `infra-header-${header}`,
            severity: header === 'content-security-policy' ? 'high' : 'medium',
            category: 'infrastructure',
            title: `Missing Security Header: ${header}`,
            description: `The ${header} security header is not implemented`,
            evidence: ['Header not present in HTTP response'],
            impact: 'Increased vulnerability to various attacks',
            likelihood: 'medium',
            cwe: ['CWE-16'],
            references: ['https://owasp.org/www-project-secure-headers/']
          });
        }
      });
    } catch {
      findings.push({
        id: 'infra-header-check-failed',
        severity: 'medium',
        category: 'infrastructure',
        title: 'Security Header Check Failed',
        description: 'Unable to verify security headers',
        evidence: ['Failed to fetch response headers'],
        impact: 'Cannot verify security header implementation',
        likelihood: 'low',
        cwe: [],
        references: []
      });
    }

    const score = this.calculateCategoryScore(findings, 100);
    return {
      score,
      status: this.getStatusFromScore(score),
      findings,
      weight: 25
    };
  }

  /**
   * Audit application security
   */
  private async auditApplication(): Promise<SecurityCategoryResult> {
    const findings: SecurityFinding[] = [];

    // Check for potential XSS vulnerabilities
    const forms = document.querySelectorAll('form');
    let unsafeFormsCount = 0;
    
    forms.forEach(form => {
      const hasCSRFToken = form.querySelector('input[name="csrf_token"], input[name="_token"]');
      if (!hasCSRFToken) {
        unsafeFormsCount++;
      }
    });

    if (unsafeFormsCount > 0) {
      findings.push({
        id: 'app-csrf-missing',
        severity: 'high',
        category: 'application',
        title: 'CSRF Protection Missing',
        description: `${unsafeFormsCount} form(s) lack CSRF protection`,
        evidence: [`Forms without CSRF tokens: ${unsafeFormsCount}`],
        impact: 'Cross-site request forgery attacks possible',
        likelihood: 'medium',
        cvssScore: 6.1,
        cwe: ['CWE-352'],
        references: ['https://owasp.org/www-community/attacks/csrf']
      });
    }

    // Check for sensitive data exposure
    const inputFields = document.querySelectorAll('input[type="password"], input[name*="password"]');
    let unsafePasswordInputs = 0;

    inputFields.forEach(input => {
      const form = input.closest('form');
      if (form && form.method.toLowerCase() !== 'post') {
        unsafePasswordInputs++;
      }
    });

    if (unsafePasswordInputs > 0) {
      findings.push({
        id: 'app-password-get',
        severity: 'high',
        category: 'application',
        title: 'Password Sent via GET',
        description: 'Password fields in forms using GET method',
        evidence: [`Unsafe password inputs: ${unsafePasswordInputs}`],
        impact: 'Passwords exposed in URL and server logs',
        likelihood: 'high',
        cvssScore: 7.5,
        cwe: ['CWE-598'],
        references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure']
      });
    }

    // Check for client-side storage of sensitive data
    const localStorageKeys = Object.keys(localStorage);
    const sensitivePatterns = ['password', 'token', 'key', 'secret', 'auth'];
    const suspiciousKeys = localStorageKeys.filter(key => 
      sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern))
    );

    if (suspiciousKeys.length > 0) {
      findings.push({
        id: 'app-sensitive-storage',
        severity: 'medium',
        category: 'application',
        title: 'Sensitive Data in Client Storage',
        description: 'Potentially sensitive data stored in localStorage',
        evidence: suspiciousKeys,
        impact: 'Sensitive data accessible to malicious scripts',
        likelihood: 'medium',
        cwe: ['CWE-922'],
        references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure']
      });
    }

    const score = this.calculateCategoryScore(findings, 100);
    return {
      score,
      status: this.getStatusFromScore(score),
      findings,
      weight: 30
    };
  }

  /**
   * Audit compliance status
   */
  private async auditCompliance(complianceReport: any): Promise<SecurityCategoryResult> {
    const findings: SecurityFinding[] = [];

    if (complianceReport.overallScore < 80) {
      findings.push({
        id: 'compliance-low-score',
        severity: complianceReport.overallScore < 60 ? 'high' : 'medium',
        category: 'compliance',
        title: 'Low Compliance Score',
        description: `Overall compliance score is ${complianceReport.overallScore}/100`,
        evidence: [`Failed checks: ${complianceReport.failedChecks}`, `Warning checks: ${complianceReport.warningChecks}`],
        impact: 'Regulatory compliance violations possible',
        likelihood: 'medium',
        cwe: [],
        references: ['https://gdpr.eu/', 'https://www.w3.org/WAI/WCAG21/quickref/']
      });
    }

    // Check specific compliance categories
    Object.entries(complianceReport.categoryScores).forEach(([category, score]: [string, any]) => {
      if (score < 70) {
        findings.push({
          id: `compliance-${category}-low`,
          severity: score < 50 ? 'high' : 'medium',
          category: 'compliance',
          title: `${category.toUpperCase()} Compliance Issues`,
          description: `${category} compliance score is ${score}/100`,
          evidence: [`Category score: ${score}`],
          impact: `${category} regulatory requirements not met`,
          likelihood: 'medium',
          cwe: [],
          references: []
        });
      }
    });

    const score = Math.max(complianceReport.overallScore, 0);
    return {
      score,
      status: this.getStatusFromScore(score),
      findings,
      weight: 20
    };
  }

  /**
   * Audit monitoring and detection capabilities
   */
  private async auditMonitoring(securityMetrics: any, threatSummary: any): Promise<SecurityCategoryResult> {
    const findings: SecurityFinding[] = [];

    // Check if security monitoring is active
    if (securityMetrics.suspiciousPatterns > 10) {
      findings.push({
        id: 'monitoring-high-suspicious',
        severity: 'medium',
        category: 'monitoring',
        title: 'High Suspicious Activity',
        description: `${securityMetrics.suspiciousPatterns} suspicious patterns detected`,
        evidence: [`Suspicious patterns: ${securityMetrics.suspiciousPatterns}`],
        impact: 'Potential ongoing attacks not being blocked',
        likelihood: 'medium',
        cwe: [],
        references: []
      });
    }

    // Check threat detection effectiveness
    if (threatSummary.riskScore > 70) {
      findings.push({
        id: 'monitoring-high-risk',
        severity: threatSummary.riskScore > 85 ? 'high' : 'medium',
        category: 'monitoring',
        title: 'High Risk Score',
        description: `System risk score is ${threatSummary.riskScore}/100`,
        evidence: [
          `Critical threats: ${threatSummary.criticalThreats}`,
          `High threats: ${threatSummary.highThreats}`,
          `Recent threats: ${threatSummary.recentThreats}`
        ],
        impact: 'High probability of successful attacks',
        likelihood: 'high',
        cwe: [],
        references: []
      });
    }

    // Calculate monitoring effectiveness score
    const monitoringScore = Math.max(0, 100 - (threatSummary.riskScore * 0.5) - (securityMetrics.suspiciousPatterns * 2));

    return {
      score: monitoringScore,
      status: this.getStatusFromScore(monitoringScore),
      findings,
      weight: 15
    };
  }

  /**
   * Audit incident response capabilities
   */
  private async auditIncidentResponse(): Promise<SecurityCategoryResult> {
    const findings: SecurityFinding[] = [];

    // Check if error tracking is implemented
    const hasErrorTracking = !!(window as any).onerror || !!(window as any).addEventListener;
    if (!hasErrorTracking) {
      findings.push({
        id: 'incident-no-error-tracking',
        severity: 'medium',
        category: 'incident_response',
        title: 'No Error Tracking',
        description: 'No global error tracking implementation found',
        evidence: ['No global error handlers detected'],
        impact: 'Security incidents may go undetected',
        likelihood: 'medium',
        cwe: [],
        references: []
      });
    }

    // Check if logging is implemented
    const hasLogging = typeof console !== 'undefined';
    if (!hasLogging) {
      findings.push({
        id: 'incident-no-logging',
        severity: 'high',
        category: 'incident_response',
        title: 'No Logging System',
        description: 'No logging system available',
        evidence: ['Console object not available'],
        impact: 'No audit trail for security events',
        likelihood: 'high',
        cwe: [],
        references: []
      });
    }

    const score = this.calculateCategoryScore(findings, 100);
    return {
      score,
      status: this.getStatusFromScore(score),
      findings,
      weight: 10
    };
  }

  /**
   * Generate security recommendations
   */
  private async generateRecommendations(
    categories: SecurityAuditResult['categories'],
    correlationSummary: any
  ): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];

    // Critical infrastructure recommendations
    const infraFindings = categories.infrastructure.findings;
    const criticalInfraFindings = infraFindings.filter(f => f.severity === 'critical');
    
    if (criticalInfraFindings.length > 0) {
      recommendations.push({
        id: 'rec-implement-https',
        priority: 'critical',
        category: 'infrastructure',
        title: 'Implement HTTPS Encryption',
        description: 'Deploy SSL/TLS certificates and enforce HTTPS across the entire application',
        implementation: {
          effort: 'medium',
          timeline: '1-2 weeks',
          cost: 'low',
          dependencies: ['SSL certificate', 'Server configuration']
        },
        impact: {
          security: 90,
          performance: -5,
          usability: 5
        }
      });
    }

    // Application security recommendations
    const appFindings = categories.application.findings;
    const csrfIssues = appFindings.filter(f => f.id.includes('csrf'));
    
    if (csrfIssues.length > 0) {
      recommendations.push({
        id: 'rec-implement-csrf',
        priority: 'high',
        category: 'application',
        title: 'Implement CSRF Protection',
        description: 'Add CSRF tokens to all forms and AJAX requests',
        implementation: {
          effort: 'medium',
          timeline: '1-2 weeks',
          cost: 'low',
          dependencies: ['Backend CSRF token generation', 'Frontend token validation']
        },
        impact: {
          security: 80,
          performance: -2,
          usability: 0
        }
      });
    }

    // Monitoring recommendations
    if (correlationSummary.overallRiskScore > 60) {
      recommendations.push({
        id: 'rec-enhance-monitoring',
        priority: 'high',
        category: 'monitoring',
        title: 'Enhance Security Monitoring',
        description: 'Implement advanced threat detection and automated response systems',
        implementation: {
          effort: 'high',
          timeline: '1-2 months',
          cost: 'medium',
          dependencies: ['SIEM system', 'Alert management', 'Response automation']
        },
        impact: {
          security: 95,
          performance: -10,
          usability: 0
        }
      });
    }

    // Compliance recommendations
    if (categories.compliance.score < 80) {
      recommendations.push({
        id: 'rec-improve-compliance',
        priority: 'medium',
        category: 'compliance',
        title: 'Improve Regulatory Compliance',
        description: 'Address compliance gaps in GDPR, accessibility, and security standards',
        implementation: {
          effort: 'high',
          timeline: '2-3 months',
          cost: 'medium',
          dependencies: ['Legal review', 'Accessibility audit', 'Privacy policy updates']
        },
        impact: {
          security: 70,
          performance: 0,
          usability: 10
        }
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Perform system health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = Date.now();
    
    // Check core system components
    const services = [
      await this.checkServiceHealth('security-monitor', () => getSecurityMonitor().getMetrics()),
      await this.checkServiceHealth('threat-intelligence', () => threatIntelligenceMonitor.getThreatSummary()),
      await this.checkServiceHealth('compliance-dashboard', () => complianceDashboard.getLatestReport()),
      await this.checkServiceHealth('performance-analyzer', () => performanceSecurityAnalyzer.getCorrelationSummary())
    ];

    // Calculate system health metrics
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const availability = (healthyServices / services.length) * 100;
    
    const securityMetrics = getSecurityMonitor().getMetrics();
    const security = Math.max(0, 100 - (securityMetrics.suspiciousPatterns * 5));
    
    const avgResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length;
    const performance = Math.max(0, 100 - (avgResponseTime / 10));
    
    const avgErrorRate = services.reduce((sum, s) => sum + s.errorRate, 0) / services.length;
    const reliability = Math.max(0, 100 - (avgErrorRate * 10));
    
    const overall = (availability + security + performance + reliability) / 4;

    // Count alerts by severity
    const threatSummary = threatIntelligenceMonitor.getThreatSummary();
    const alerts = {
      critical: threatSummary.criticalThreats,
      high: threatSummary.highThreats,
      medium: threatSummary.recentThreats,
      low: 0
    };

    // Generate health recommendations
    const recommendations = this.generateHealthRecommendations(services, overall);

    const healthCheck: HealthCheckResult = {
      timestamp,
      systemHealth: {
        overall: Math.round(overall),
        security: Math.round(security),
        performance: Math.round(performance),
        availability: Math.round(availability),
        reliability: Math.round(reliability)
      },
      alerts,
      services,
      recommendations
    };

    this.healthChecks.push(healthCheck);

    // Keep only last 20 health checks
    if (this.healthChecks.length > 20) {
      this.healthChecks = this.healthChecks.slice(-20);
    }

    return healthCheck;
  }

  /**
   * Helper methods
   */
  private async checkServiceHealth(
    name: string, 
    healthCheck: () => any
  ): Promise<HealthCheckResult['services'][0]> {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'down' | 'unknown' = 'unknown';
    let errorRate = 0;

    try {
      const result = healthCheck();
      status = result ? 'healthy' : 'degraded';
    } catch {
      status = 'down';
      errorRate = 100;
    }

    const responseTime = Date.now() - startTime;

    return {
      name,
      status,
      responseTime,
      errorRate,
      lastCheck: Date.now()
    };
  }

  private generateHealthRecommendations(services: any[], overallHealth: number): string[] {
    const recommendations: string[] = [];

    if (overallHealth < 70) {
      recommendations.push('System health is below optimal - investigate degraded services');
    }

    const downServices = services.filter(s => s.status === 'down');
    if (downServices.length > 0) {
      recommendations.push(`Critical: ${downServices.length} service(s) are down - immediate attention required`);
    }

    const degradedServices = services.filter(s => s.status === 'degraded');
    if (degradedServices.length > 0) {
      recommendations.push(`Warning: ${degradedServices.length} service(s) are degraded - monitor closely`);
    }

    const slowServices = services.filter(s => s.responseTime > 1000);
    if (slowServices.length > 0) {
      recommendations.push(`Performance: ${slowServices.length} service(s) have slow response times`);
    }

    return recommendations;
  }

  private calculateOverallScore(categories: SecurityAuditResult['categories']): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.values(categories).forEach(category => {
      totalScore += category.score * category.weight;
      totalWeight += category.weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  private determineRiskLevel(score: number): SecurityAuditResult['riskLevel'] {
    if (score >= 90) return 'low';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'high';
    return 'critical';
  }

  private calculateCategoryScore(findings: SecurityFinding[], baseScore: number): number {
    let score = baseScore;
    
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });

    return Math.max(0, score);
  }

  private getStatusFromScore(score: number): SecurityCategoryResult['status'] {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private collectCriticalFindings(categories: SecurityAuditResult['categories']): SecurityFinding[] {
    const criticalFindings: SecurityFinding[] = [];
    
    Object.values(categories).forEach(category => {
      category.findings.forEach(finding => {
        if (finding.severity === 'critical' || finding.severity === 'high') {
          criticalFindings.push(finding);
        }
      });
    });

    return criticalFindings.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private calculateTrends(currentScore: number): SecurityAuditResult['trends'] {
    const previousAudit = this.auditResults[this.auditResults.length - 1];
    const previousScore = previousAudit?.overallScore || 0;
    
    const improvement = Math.max(0, currentScore - previousScore);
    const deterioration = Math.max(0, previousScore - currentScore);

    return {
      previousScore,
      improvement,
      deterioration
    };
  }

  private scheduleRegularAudits(): void {
    // Perform health checks every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Perform full security audits every hour
    setInterval(() => {
      this.performSecurityAudit();
    }, 60 * 60 * 1000);
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Public API methods
   */
  getLatestAudit(): SecurityAuditResult | null {
    return this.auditResults[this.auditResults.length - 1] || null;
  }

  getLatestHealthCheck(): HealthCheckResult | null {
    return this.healthChecks[this.healthChecks.length - 1] || null;
  }

  getAllAudits(): SecurityAuditResult[] {
    return [...this.auditResults];
  }

  getAllHealthChecks(): HealthCheckResult[] {
    return [...this.healthChecks];
  }

  exportAuditData(): string {
    return JSON.stringify({
      audits: this.auditResults,
      healthChecks: this.healthChecks,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const securityAuditor = new SecurityAuditor();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).securityAuditor = securityAuditor;
}
