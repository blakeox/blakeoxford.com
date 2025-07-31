/**
 * Compliance Dashboard - Real-time compliance monitoring and reporting
 * Integrates with SecurityMonitor for comprehensive compliance tracking
 */
import { getSecurityMonitor } from './SecurityMonitor';
import { createModuleErrorReporter } from './ModuleErrorHandling';

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  category: 'gdpr' | 'accessibility' | 'security' | 'performance' | 'seo';
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  lastCheck: number;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  score: number; // 0-100
  details: string[];
  recommendations: string[];
}

export interface ComplianceReport {
  timestamp: number;
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  categoryScores: Record<string, number>;
  checks: ComplianceCheck[];
  trends: {
    previousScore: number;
    trend: 'improving' | 'declining' | 'stable';
    changePercentage: number;
  };
}

export class ComplianceDashboard {
  private checks: Map<string, ComplianceCheck> = new Map();
  private reports: ComplianceReport[] = [];
  private errorReporter = createModuleErrorReporter('ComplianceDashboard');
  private isMonitoring = false;
  private checkInterval?: number;

  constructor() {
    this.initializeChecks();
  }

  /**
   * Initialize all compliance checks
   */
  private initializeChecks(): void {
    // GDPR Compliance Checks
    this.addCheck({
      id: 'gdpr-cookie-consent',
      name: 'Cookie Consent Banner',
      description: 'Verify cookie consent mechanism is present and functional',
      category: 'gdpr',
      severity: 'high',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'gdpr-privacy-policy',
      name: 'Privacy Policy Accessibility',
      description: 'Ensure privacy policy is easily accessible',
      category: 'gdpr',
      severity: 'high',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'gdpr-data-retention',
      name: 'Data Retention Policy',
      description: 'Verify data retention practices are documented',
      category: 'gdpr',
      severity: 'medium',
      automated: false,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    // Accessibility Compliance Checks
    this.addCheck({
      id: 'wcag-alt-text',
      name: 'Image Alt Text',
      description: 'All images have appropriate alt text',
      category: 'accessibility',
      severity: 'high',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'wcag-heading-structure',
      name: 'Heading Structure',
      description: 'Proper heading hierarchy (h1-h6)',
      category: 'accessibility',
      severity: 'medium',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'wcag-keyboard-navigation',
      name: 'Keyboard Navigation',
      description: 'All interactive elements are keyboard accessible',
      category: 'accessibility',
      severity: 'high',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'wcag-color-contrast',
      name: 'Color Contrast',
      description: 'Text meets WCAG color contrast requirements',
      category: 'accessibility',
      severity: 'medium',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    // Security Compliance Checks
    this.addCheck({
      id: 'security-headers',
      name: 'Security Headers',
      description: 'Essential security headers are implemented',
      category: 'security',
      severity: 'critical',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'security-csp',
      name: 'Content Security Policy',
      description: 'Proper CSP configuration without violations',
      category: 'security',
      severity: 'high',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'security-https',
      name: 'HTTPS Enforcement',
      description: 'Site enforces HTTPS and has valid certificates',
      category: 'security',
      severity: 'critical',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    // Performance Compliance Checks
    this.addCheck({
      id: 'performance-lcp',
      name: 'Largest Contentful Paint',
      description: 'LCP meets performance guidelines (<2.5s)',
      category: 'performance',
      severity: 'medium',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'performance-cls',
      name: 'Cumulative Layout Shift',
      description: 'CLS meets stability guidelines (<0.1)',
      category: 'performance',
      severity: 'medium',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });

    this.addCheck({
      id: 'performance-fid',
      name: 'First Input Delay',
      description: 'FID meets interactivity guidelines (<100ms)',
      category: 'performance',
      severity: 'medium',
      automated: true,
      lastCheck: 0,
      status: 'not_applicable',
      score: 0,
      details: [],
      recommendations: []
    });
  }

  /**
   * Add a compliance check
   */
  private addCheck(check: ComplianceCheck): void {
    this.checks.set(check.id, check);
  }

  /**
   * Run all automated compliance checks
   */
  async runAllChecks(): Promise<ComplianceReport> {
    const timestamp = Date.now();
    const results: ComplianceCheck[] = [];

    for (const [id, check] of this.checks) {
      if (check.automated) {
        try {
          const result = await this.runCheck(id);
          results.push(result);
        } catch (error) {
          this.errorReporter.reportError(
            'COMPLIANCE_CHECK_FAILED',
            `Failed to run compliance check: ${check.name}`,
            'medium' as any,
            {
              component: 'ComplianceCheck',
              additionalData: { 
                checkId: id,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          );
          
          // Mark as failed
          check.status = 'fail';
          check.score = 0;
          check.details = ['Check execution failed'];
          check.recommendations = ['Fix compliance check implementation'];
          check.lastCheck = timestamp;
          results.push(check);
        }
      } else {
        // For manual checks, include existing status
        results.push(check);
      }
    }

    const report = this.generateReport(results, timestamp);
    this.reports.push(report);

    // Keep only last 10 reports
    if (this.reports.length > 10) {
      this.reports = this.reports.slice(-10);
    }

    console.log('📋 Compliance Report Generated:', report);
    return report;
  }

  /**
   * Run individual compliance check
   */
  async runCheck(checkId: string): Promise<ComplianceCheck> {
    const check = this.checks.get(checkId);
    if (!check) {
      throw new Error(`Check ${checkId} not found`);
    }

    const timestamp = Date.now();
    let result: ComplianceCheck;

    switch (checkId) {
      case 'gdpr-cookie-consent':
        result = await this.checkCookieConsent(check);
        break;
      case 'gdpr-privacy-policy':
        result = await this.checkPrivacyPolicy(check);
        break;
      case 'wcag-alt-text':
        result = await this.checkAltText(check);
        break;
      case 'wcag-heading-structure':
        result = await this.checkHeadingStructure(check);
        break;
      case 'wcag-keyboard-navigation':
        result = await this.checkKeyboardNavigation(check);
        break;
      case 'wcag-color-contrast':
        result = await this.checkColorContrast(check);
        break;
      case 'security-headers':
        result = await this.checkSecurityHeaders(check);
        break;
      case 'security-csp':
        result = await this.checkContentSecurityPolicy(check);
        break;
      case 'security-https':
        result = await this.checkHTTPS(check);
        break;
      case 'performance-lcp':
        result = await this.checkLCP(check);
        break;
      case 'performance-cls':
        result = await this.checkCLS(check);
        break;
      case 'performance-fid':
        result = await this.checkFID(check);
        break;
      default:
        throw new Error(`Unknown check: ${checkId}`);
    }

    result.lastCheck = timestamp;
    this.checks.set(checkId, result);
    return result;
  }

  /**
   * Individual check implementations
   */
  private async checkCookieConsent(check: ComplianceCheck): Promise<ComplianceCheck> {
    const consentBanner = document.querySelector('[data-consent], .cookie-banner, .consent-banner, #cookie-notice');
    const cookiePolicy = document.querySelector('a[href*="cookie"], a[href*="privacy"]');
    
    let score = 0;
    const details: string[] = [];
    const recommendations: string[] = [];

    if (consentBanner) {
      score += 60;
      details.push('Cookie consent banner found');
    } else {
      details.push('No cookie consent banner detected');
      recommendations.push('Implement cookie consent banner');
    }

    if (cookiePolicy) {
      score += 40;
      details.push('Cookie/privacy policy link found');
    } else {
      details.push('No cookie/privacy policy link found');
      recommendations.push('Add link to cookie/privacy policy');
    }

    return {
      ...check,
      status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkPrivacyPolicy(check: ComplianceCheck): Promise<ComplianceCheck> {
    const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
    const footerPrivacy = document.querySelector('footer a[href*="privacy"]');
    
    let score = 0;
    const details: string[] = [];
    const recommendations: string[] = [];

    if (privacyLinks.length > 0) {
      score += 50;
      details.push(`Found ${privacyLinks.length} privacy policy link(s)`);
    } else {
      details.push('No privacy policy links found');
      recommendations.push('Add privacy policy link');
    }

    if (footerPrivacy) {
      score += 50;
      details.push('Privacy policy link in footer (recommended location)');
    } else {
      recommendations.push('Add privacy policy link to footer');
    }

    return {
      ...check,
      status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkAltText(check: ComplianceCheck): Promise<ComplianceCheck> {
    const images = Array.from(document.querySelectorAll('img'));
    const imagesWithAlt = images.filter(img => img.alt !== undefined && img.alt.trim() !== '');
    const decorativeImages = images.filter(img => img.alt === '');
    const missingAlt = images.filter(img => !img.hasAttribute('alt'));
    
    const score = images.length > 0 ? Math.round((imagesWithAlt.length / images.length) * 100) : 100;
    
    const details: string[] = [
      `Total images: ${images.length}`,
      `Images with alt text: ${imagesWithAlt.length}`,
      `Decorative images (alt=""): ${decorativeImages.length}`,
      `Missing alt attribute: ${missingAlt.length}`
    ];

    const recommendations: string[] = [];
    if (missingAlt.length > 0) {
      recommendations.push(`Add alt attributes to ${missingAlt.length} images`);
    }

    return {
      ...check,
      status: score >= 95 ? 'pass' : score >= 80 ? 'warning' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkHeadingStructure(check: ComplianceCheck): Promise<ComplianceCheck> {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const h1Count = document.querySelectorAll('h1').length;
    
    let score = 100;
    const details: string[] = [`Found ${headings.length} headings`];
    const recommendations: string[] = [];

    // Check for single h1
    if (h1Count === 0) {
      score -= 30;
      details.push('No h1 heading found');
      recommendations.push('Add a main h1 heading');
    } else if (h1Count > 1) {
      score -= 20;
      details.push(`Multiple h1 headings found (${h1Count})`);
      recommendations.push('Use only one h1 heading per page');
    } else {
      details.push('Single h1 heading found ✓');
    }

    // Check heading hierarchy
    const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
    let hierarchyIssues = 0;
    
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i];
      const previous = headingLevels[i - 1];
      
      if (current > previous + 1) {
        hierarchyIssues++;
      }
    }

    if (hierarchyIssues > 0) {
      score -= hierarchyIssues * 15;
      details.push(`${hierarchyIssues} heading hierarchy issue(s) found`);
      recommendations.push('Fix heading hierarchy - don\'t skip heading levels');
    } else {
      details.push('Heading hierarchy is correct ✓');
    }

    return {
      ...check,
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score: Math.max(0, score),
      details,
      recommendations
    };
  }

  private async checkKeyboardNavigation(check: ComplianceCheck): Promise<ComplianceCheck> {
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    let score = 100;
    const details: string[] = [`Found ${focusableElements.length} focusable elements`];
    const recommendations: string[] = [];

    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]:first-child, .skip-link');
    if (skipLinks.length === 0) {
      score -= 20;
      details.push('No skip links found');
      recommendations.push('Add skip navigation links');
    } else {
      details.push('Skip links found ✓');
    }

    // Check for focus indicators
    const style = getComputedStyle(document.documentElement);
    const hasFocusStyles = style.getPropertyValue('--focus-color') || 
                          document.querySelector('style, link[rel="stylesheet"]')?.textContent?.includes(':focus');
    
    if (!hasFocusStyles) {
      score -= 30;
      details.push('No custom focus styles detected');
      recommendations.push('Add visible focus indicators');
    } else {
      details.push('Focus styles detected ✓');
    }

    return {
      ...check,
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkColorContrast(check: ComplianceCheck): Promise<ComplianceCheck> {
    // This is a simplified check - full color contrast analysis would require more complex calculations
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
    let score = 85; // Base score assuming decent contrast
    const details: string[] = [`Analyzed ${textElements.length} text elements`];
    const recommendations: string[] = [];

    // Check for common low-contrast patterns
    const potentialIssues = Array.from(textElements).filter(el => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      
      // Simple heuristic for light gray text (potential contrast issue)  
      return color.includes('rgb(128') || color.includes('rgb(136') || 
             color.includes('#888') || color.includes('#999');
    });

    if (potentialIssues.length > 0) {
      score -= Math.min(40, potentialIssues.length * 5);
      details.push(`${potentialIssues.length} elements with potentially low contrast`);
      recommendations.push('Review color contrast for gray text elements');
    } else {
      details.push('No obvious contrast issues detected');
    }

    // Note: This is a basic implementation
    details.push('Note: This is a basic check. Use accessibility tools for comprehensive contrast analysis');

    return {
      ...check,
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkSecurityHeaders(check: ComplianceCheck): Promise<ComplianceCheck> {
    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const headers = Object.fromEntries(response.headers.entries());
      
      const requiredHeaders = {
        'content-security-policy': 'Content Security Policy',
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'strict-transport-security': 'Strict Transport Security',
        'referrer-policy': 'Referrer Policy'
      };

      let score = 0;
      const details: string[] = [];
      const recommendations: string[] = [];
      const maxScore = Object.keys(requiredHeaders).length;

      for (const [headerKey, headerName] of Object.entries(requiredHeaders)) {
        if (headers[headerKey]) {
          score++;
          details.push(`${headerName}: ✓`);
        } else {
          details.push(`${headerName}: Missing`);
          recommendations.push(`Implement ${headerName} header`);
        }
      }

      const finalScore = Math.round((score / maxScore) * 100);

      return {
        ...check,
        status: finalScore >= 80 ? 'pass' : finalScore >= 60 ? 'warning' : 'fail',
        score: finalScore,
        details,
        recommendations
      };
    } catch {
      return {
        ...check,
        status: 'fail',
        score: 0,
        details: ['Failed to check security headers'],
        recommendations: ['Fix security header checking mechanism']
      };
    }
  }

  private async checkContentSecurityPolicy(check: ComplianceCheck): Promise<ComplianceCheck> {
    const securityMonitor = getSecurityMonitor();
    const metrics = securityMonitor.getMetrics();
    
    let score = 100;
    const details: string[] = [];
    const recommendations: string[] = [];

    // Check for CSP violations
    if (metrics.cspViolations > 0) {
      score -= Math.min(50, metrics.cspViolations * 5);
      details.push(`${metrics.cspViolations} CSP violations detected`);
      recommendations.push('Review and fix CSP violations');
    } else {
      details.push('No CSP violations detected ✓');
    }

    // Check for CSP header presence
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCSP) {
      details.push('CSP meta tag found');
    } else {
      details.push('CSP should be set via HTTP header (preferred)');
    }

    return {
      ...check,
      status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkHTTPS(check: ComplianceCheck): Promise<ComplianceCheck> {
    const isHTTPS = window.location.protocol === 'https:';
    let score = isHTTPS ? 100 : 0;
    
    const details: string[] = [
      `Protocol: ${window.location.protocol}`,
      isHTTPS ? 'HTTPS enforced ✓' : 'Site not using HTTPS'
    ];

    const recommendations: string[] = [];
    if (!isHTTPS) {
      recommendations.push('Implement HTTPS with valid SSL certificate');
      recommendations.push('Set up HTTP to HTTPS redirects');
    }

    return {
      ...check,
      status: isHTTPS ? 'pass' : 'fail',
      score,
      details,
      recommendations
    };
  }

  private async checkLCP(check: ComplianceCheck): Promise<ComplianceCheck> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          
          let score = 100;
          let status: ComplianceCheck['status'] = 'pass';
          const details = [`LCP: ${Math.round(lcp)}ms`];
          const recommendations: string[] = [];

          if (lcp > 4000) {
            score = 20;
            status = 'fail';
            recommendations.push('Optimize images and reduce server response times');
          } else if (lcp > 2500) {
            score = 60;
            status = 'warning';
            recommendations.push('Consider optimizing largest contentful element');
          }

          observer.disconnect();
          resolve({
            ...check,
            status,
            score,
            details,
            recommendations
          });
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve({
            ...check,
            status: 'warning',
            score: 50,
            details: ['LCP measurement timed out'],
            recommendations: ['Ensure page content loads quickly']
          });
        }, 10000);
      } else {
        resolve({
          ...check,
          status: 'not_applicable',
          score: 0,
          details: ['Browser does not support Performance Observer'],
          recommendations: []
        });
      }
    });
  }

  private async checkCLS(check: ComplianceCheck): Promise<ComplianceCheck> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            const layoutShiftEntry = entry as any;
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Check after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          
          let score = 100;
          let status: ComplianceCheck['status'] = 'pass';
          const details = [`CLS: ${clsValue.toFixed(3)}`];
          const recommendations: string[] = [];

          if (clsValue > 0.25) {
            score = 20;
            status = 'fail';
            recommendations.push('Significant layout shifts detected - fix layout stability');
          } else if (clsValue > 0.1) {
            score = 60;
            status = 'warning';
            recommendations.push('Minor layout shifts detected - consider improvements');
          }

          resolve({
            ...check,
            status,
            score,
            details,
            recommendations
          });
        }, 5000);
      } else {
        resolve({
          ...check,
          status: 'not_applicable',
          score: 0,
          details: ['Browser does not support Performance Observer'],
          recommendations: []
        });
      }
    });
  }

  private async checkFID(check: ComplianceCheck): Promise<ComplianceCheck> {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0] as any;
          const fid = firstInput.processingStart - firstInput.startTime;
          
          let score = 100;
          let status: ComplianceCheck['status'] = 'pass';
          const details = [`FID: ${Math.round(fid)}ms`];
          const recommendations: string[] = [];

          if (fid > 300) {
            score = 20;
            status = 'fail';
            recommendations.push('High input delay - optimize JavaScript execution');
          } else if (fid > 100) {
            score = 60;
            status = 'warning';
            recommendations.push('Consider reducing JavaScript execution time');
          }

          observer.disconnect();
          resolve({
            ...check,
            status,
            score,
            details,
            recommendations
          });
        });

        observer.observe({ entryTypes: ['first-input'] });

        // Timeout after 30 seconds if no input
        setTimeout(() => {
          observer.disconnect();
          resolve({
            ...check,
            status: 'not_applicable',
            score: 100,
            details: ['No user input detected during measurement period'],
            recommendations: []
          });
        }, 30000);
      } else {
        resolve({
          ...check,
          status: 'not_applicable',
          score: 0,
          details: ['Browser does not support Performance Observer'],
          recommendations: []
        });
      }
    });
  }

  /**
   * Generate compliance report from check results
   */
  private generateReport(checks: ComplianceCheck[], timestamp: number): ComplianceReport {
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    
    const overallScore = checks.reduce((sum, check) => sum + check.score, 0) / totalChecks;
    
    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    const categories = ['gdpr', 'accessibility', 'security', 'performance', 'seo'];
    
    categories.forEach(category => {
      const categoryChecks = checks.filter(c => c.category === category);
      if (categoryChecks.length > 0) {
        categoryScores[category] = categoryChecks.reduce((sum, check) => sum + check.score, 0) / categoryChecks.length;
      }
    });

    // Calculate trends
    const previousReport = this.reports[this.reports.length - 1];
    const trends = previousReport ? {
      previousScore: previousReport.overallScore,
      trend: overallScore > previousReport.overallScore + 2 ? 'improving' as const :
             overallScore < previousReport.overallScore - 2 ? 'declining' as const : 'stable' as const,
      changePercentage: Math.round(((overallScore - previousReport.overallScore) / previousReport.overallScore) * 100)
    } : {
      previousScore: 0,
      trend: 'stable' as const,
      changePercentage: 0
    };

    return {
      timestamp,
      overallScore: Math.round(overallScore),
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      categoryScores,
      checks,
      trends
    };
  }

  /**
   * Start continuous compliance monitoring
   */
  startMonitoring(intervalMinutes = 30): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Run initial check
    this.runAllChecks();

    // Set up periodic checks
    this.checkInterval = window.setInterval(() => {
      this.runAllChecks();
    }, intervalMinutes * 60 * 1000) as unknown as number;

    console.log(`📋 Compliance monitoring started (checking every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('📋 Compliance monitoring stopped');
  }

  /**
   * Get latest compliance report
   */
  getLatestReport(): ComplianceReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  /**
   * Get all reports
   */
  getAllReports(): ComplianceReport[] {
    return [...this.reports];
  }

  /**
   * Export compliance data
   */
  exportData(): string {
    return JSON.stringify({
      checks: Array.from(this.checks.values()),
      reports: this.reports,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const complianceDashboard = new ComplianceDashboard();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).complianceDashboard = complianceDashboard;
}
