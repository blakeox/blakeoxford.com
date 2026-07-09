/**
 * Minimal security monitor implementation consumed by AdvancedMonitoringSystem.
 * Provides typed no-op methods so the monitoring system can operate safely.
 */

import { logger } from './logger';

export interface SecurityMonitorConfig {
  enabled: boolean;
  debugMode?: boolean;
  csrfProtection?: {
    enabled: boolean;
    tokenLength: number;
  };
  contentSecurityPolicy?: {
    enabled: boolean;
    reportOnly?: boolean;
    reportUri?: string;
  };
}

export interface SecurityReport {
  status: 'ok' | 'degraded';
  timestamp: number;
  issues: string[];
}

class SecurityMonitor {
  constructor(private readonly config: SecurityMonitorConfig) {}

  generateSecurityReport(): SecurityReport {
    return {
      status: this.config.enabled ? 'ok' : 'degraded',
      timestamp: Date.now(),
      issues: [],
    };
  }

  shutdown(): void {
    if (this.config.debugMode) {
      logger.debug('[SecurityMonitor] shutdown');
    }
  }
}

export const initSecurityMonitor = (config: SecurityMonitorConfig): SecurityMonitor => {
  return new SecurityMonitor(config);
};
