/**
 * Security Monitor - Enhanced Security Monitoring and Threat Detection
 * Monitors for security threats, rate limiting, CSRF protection, and vulnerability tracking
 */

export interface SecurityMetrics {
  // Request patterns
  requestsPerMinute: number;
  uniqueIPsPerHour: number;
  suspiciousPatterns: number;
  
  // Authentication attempts
  failedLoginAttempts: number;
  successfulLogins: number;
  
  // Content Security Policy violations
  cspViolations: number;
  
  // Form submission monitoring
  formSubmissions: number;
  suspiciousFormData: number;
  
  // Bot detection
  botRequests: number;
  humanRequests: number;
  
  // Error patterns
  clientErrors: number;
  serverErrors: number;
  
  // Resource access patterns
  sensitiveResourceAccess: number;
  blockedRequests: number;
}

export interface SecurityEvent {
  type: 'rate_limit' | 'csp_violation' | 'suspicious_pattern' | 'bot_detection' | 'form_spam' | 'resource_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  ip?: string;
  userAgent?: string;
  url?: string;
  data?: Record<string, unknown>;
  blocked: boolean;
}

export interface SecurityConfig {
  enabled: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    enabled: boolean;
  };
  csrfProtection: {
    enabled: boolean;
    tokenLength: number;
  };
  botDetection: {
    enabled: boolean;
    suspiciousUserAgents: string[];
    honeypotFields: string[];
  };
  contentSecurityPolicy: {
    enabled: boolean;
    reportOnly: boolean;
    reportUri?: string;
  };
  debugMode: boolean;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private config: SecurityConfig;
  private metrics: SecurityMetrics;
  private events: SecurityEvent[] = [];
  private requestCounts = new Map<string, number[]>();
  private suspiciousIPs = new Set<string>();
  private csrfTokens = new Map<string, { token: string; timestamp: number }>();
  
  private constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enabled: true,
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        enabled: true
      },
      csrfProtection: {
        enabled: true,
        tokenLength: 32
      },
      botDetection: {
        enabled: true,
        suspiciousUserAgents: [
          'bot', 'crawler', 'spider', 'scraper', 'scanner',
          'sqlmap', 'nikto', 'burp', 'nmap', 'curl'
        ],
        honeypotFields: ['phone_number', 'fax', 'company_name']
      },
      contentSecurityPolicy: {
        enabled: true,
        reportOnly: false,
        reportUri: '/api/csp-report'
      },
      debugMode: false,
      ...config
    };
    
    this.metrics = {
      requestsPerMinute: 0,
      uniqueIPsPerHour: 0,
      suspiciousPatterns: 0,
      failedLoginAttempts: 0,
      successfulLogins: 0,
      cspViolations: 0,
      formSubmissions: 0,
      suspiciousFormData: 0,
      botRequests: 0,
      humanRequests: 0,
      clientErrors: 0,
      serverErrors: 0,
      sensitiveResourceAccess: 0,
      blockedRequests: 0
    };
    
    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initializeBrowserSecurity();
    }
  }
  
  static getInstance(config?: Partial<SecurityConfig>): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor(config);
    }
    return SecurityMonitor.instance;
  }
  
  /**
   * Initialize browser-side security monitoring
   */
  private initializeBrowserSecurity(): void {
    this.setupCSPViolationReporting();
    this.setupFormSecurityMonitoring();
    this.setupNetworkSecurityMonitoring();
    this.setupErrorSecurityMonitoring();
    this.generateCSRFToken();
    
    if (this.config.debugMode) {
      console.log('🔒 Security monitoring initialized');
    }
  }
  
  /**
   * Setup Content Security Policy violation reporting
   */
  private setupCSPViolationReporting(): void {
    if (!this.config.contentSecurityPolicy.enabled) return;
    
    document.addEventListener('securitypolicyviolation', (event) => {
      this.metrics.cspViolations++;
      
      const securityEvent: SecurityEvent = {
        type: 'csp_violation',
        severity: 'medium',
        timestamp: Date.now(),
        url: event.documentURI,
        data: {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          originalPolicy: event.originalPolicy,
          disposition: event.disposition
        },
        blocked: event.disposition === 'enforce'
      };
      
      this.recordSecurityEvent(securityEvent);
      
      if (this.config.contentSecurityPolicy.reportUri) {
        this.reportCSPViolation(event);
      }
    });
  }
  
  /**
   * Setup form security monitoring
   */
  private setupFormSecurityMonitoring(): void {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;
      
      this.metrics.formSubmissions++;
      
      // Check for honeypot fields (bot detection)
      const formData = new FormData(form);
      let suspiciousFields = 0;
      
      for (const fieldName of this.config.botDetection.honeypotFields) {
        if (formData.get(fieldName)) {
          suspiciousFields++;
        }
      }
      
      if (suspiciousFields > 0) {
        this.metrics.suspiciousFormData++;
        this.metrics.botRequests++;
        
        const securityEvent: SecurityEvent = {
          type: 'form_spam',
          severity: 'high',
          timestamp: Date.now(),
          url: window.location.href,
          data: {
            suspiciousFields,
            formAction: form.action,
            method: form.method
          },
          blocked: false
        };
        
        this.recordSecurityEvent(securityEvent);
        
        // Optionally block the submission
        if (suspiciousFields >= this.config.botDetection.honeypotFields.length / 2) {
          event.preventDefault();
          securityEvent.blocked = true;
          this.metrics.blockedRequests++;
        }
      } else {
        this.metrics.humanRequests++;
      }
      
      // Validate CSRF token
      if (this.config.csrfProtection.enabled) {
        this.validateCSRFToken(formData);
      }
    });
  }
  
  /**
   * Setup network security monitoring
   */
  private setupNetworkSecurityMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Monitor for suspicious response patterns
      if (response.status >= 400) {
        if (response.status < 500) {
          this.metrics.clientErrors++;
        } else {
          this.metrics.serverErrors++;
        }
        
        // Check for potential security issues
        if (response.status === 401 || response.status === 403) {
          this.metrics.failedLoginAttempts++;
        }
      }
      
      return response;
    };
  }
  
  /**
   * Setup error security monitoring
   */
  private setupErrorSecurityMonitoring(): void {
    window.addEventListener('error', (event) => {
      // Check for potential XSS attempts in error messages
      if (this.containsSuspiciousContent(event.message)) {
        const securityEvent: SecurityEvent = {
          type: 'suspicious_pattern',
          severity: 'medium',
          timestamp: Date.now(),
          url: event.filename,
          data: {
            message: event.message,
            line: event.lineno,
            column: event.colno
          },
          blocked: false
        };
        
        this.recordSecurityEvent(securityEvent);
        this.metrics.suspiciousPatterns++;
      }
    });
  }
  
  /**
   * Generate CSRF token for forms
   */
  generateCSRFToken(): string {
    if (!this.config.csrfProtection.enabled) return '';
    
    const sessionId = this.getSessionId();
    const token = this.generateRandomToken(this.config.csrfProtection.tokenLength);
    
    this.csrfTokens.set(sessionId, {
      token,
      timestamp: Date.now()
    });
    
    // Store in meta tag for JavaScript access
    let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = token;
    
    return token;
  }
  
  /**
   * Validate CSRF token
   */
  private validateCSRFToken(formData: FormData): boolean {
    if (!this.config.csrfProtection.enabled) return true;
    
    const submittedToken = formData.get('csrf_token') as string;
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const sessionId = this.getSessionId();
    const storedTokenData = this.csrfTokens.get(sessionId);
    
    if (!submittedToken || !storedTokenData) {
      this.recordSecurityEvent({
        type: 'suspicious_pattern',
        severity: 'high',
        timestamp: Date.now(),
        url: window.location.href,
        data: { reason: 'Missing CSRF token' },
        blocked: true
      });
      return false;
    }
    
    // Check token validity (not expired, matches stored token)
    const tokenAge = Date.now() - storedTokenData.timestamp;
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    if (tokenAge > maxAge || submittedToken !== storedTokenData.token || submittedToken !== metaToken) {
      this.recordSecurityEvent({
        type: 'suspicious_pattern',
        severity: 'high',
        timestamp: Date.now(),
        url: window.location.href,
        data: { reason: 'Invalid CSRF token' },
        blocked: true
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Record security event
   */
  private recordSecurityEvent(event: SecurityEvent): void {
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    if (this.config.debugMode) {
      console.warn(`🚨 Security Event: ${event.type}`, event);
    }
    
    // Report critical events immediately
    if (event.severity === 'critical') {
      this.reportSecurityEvent(event);
    }
  }
  
  /**
   * Check for suspicious content patterns
   */
  private containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /alert\(/i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i,
      /eval\(/i,
      /Function\(/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }
  
  /**
   * Generate random token
   */
  private generateRandomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const cryptoObj = window.crypto || (window as any).msCrypto;
    
    if (cryptoObj && cryptoObj.getRandomValues) {
      const array = new Uint8Array(length);
      cryptoObj.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for older browsers
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }
  
  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = this.generateRandomToken(16);
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }
  
  /**
   * Report CSP violation to server
   */
  private async reportCSPViolation(event: SecurityPolicyViolationEvent): Promise<void> {
    if (!this.config.contentSecurityPolicy.reportUri) return;
    
    try {
      await fetch(this.config.contentSecurityPolicy.reportUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'csp-report': {
            'document-uri': event.documentURI,
            'referrer': event.referrer,
            'violated-directive': event.violatedDirective,
            'effective-directive': event.effectiveDirective,
            'original-policy': event.originalPolicy,
            'blocked-uri': event.blockedURI,
            'line-number': event.lineNumber,
            'column-number': event.columnNumber,
            'source-file': event.sourceFile,
            'status-code': event.statusCode,
            'script-sample': event.sample
          }
        })
      });
    } catch (error) {
      if (this.config.debugMode) {
        console.error('Failed to report CSP violation:', error);
      }
    }
  }
  
  /**
   * Report security event to server
   */
  private async reportSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      if (this.config.debugMode) {
        console.error('Failed to report security event:', error);
      }
    }
  }
  
  /**
   * Get current security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get recent security events
   */
  getEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }
  
  /**
   * Get security report
   */
  generateSecurityReport(): {
    timestamp: string;
    metrics: SecurityMetrics;
    recentEvents: SecurityEvent[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    if (this.metrics.cspViolations > 10) {
      recommendations.push('High number of CSP violations detected - review and update Content Security Policy');
    }
    
    if (this.metrics.botRequests > this.metrics.humanRequests * 0.5) {
      recommendations.push('High bot activity detected - consider implementing additional bot protection');
    }
    
    if (this.metrics.suspiciousPatterns > 5) {
      recommendations.push('Suspicious patterns detected - review error logs and implement additional input validation');
    }
    
    if (this.metrics.failedLoginAttempts > 20) {
      recommendations.push('High number of failed login attempts - consider implementing account lockout protection');
    }
    
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      recentEvents: this.getEvents(50),
      recommendations
    };
  }
  
  /**
   * Export security data for analysis
   */
  exportSecurityData(): string {
    const report = this.generateSecurityReport();
    return JSON.stringify(report, null, 2);
  }
  
  /**
   * Start security monitoring session
   */
  startMonitoring(): void {
    if (this.config.debugMode) {
      console.log('🔒 Security monitoring started');
      
      // Log security report every 5 minutes in debug mode
      setInterval(() => {
        console.group('🔒 Security Report');
        const report = this.generateSecurityReport();
        console.log('Metrics:', report.metrics);
        console.log('Recent Events:', report.recentEvents.slice(-5));
        if (report.recommendations.length > 0) {
          console.log('Recommendations:', report.recommendations);
        }
        console.groupEnd();
      }, 5 * 60 * 1000);
    }
  }
}

// Global instance management
let globalSecurityMonitor: SecurityMonitor;

export function initSecurityMonitor(config?: Partial<SecurityConfig>): SecurityMonitor {
  if (!globalSecurityMonitor) {
    globalSecurityMonitor = SecurityMonitor.getInstance(config);
  }
  return globalSecurityMonitor;
}

export function getSecurityMonitor(): SecurityMonitor {
  if (!globalSecurityMonitor) {
    globalSecurityMonitor = SecurityMonitor.getInstance();
  }
  return globalSecurityMonitor;
}

// Auto-initialize security monitoring
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const monitor = initSecurityMonitor();
      monitor.startMonitoring();
    });
  } else {
    const monitor = initSecurityMonitor();
    monitor.startMonitoring();
  }
}
