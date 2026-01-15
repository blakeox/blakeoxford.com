/**
 * Centralized logging utility
 * 
 * Provides consistent logging across the application with:
 * - Environment-aware logging (dev vs production)
 * - Debug mode support
 * - Structured log levels
 * - No-op in production for performance
 * 
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 * 
 * logger.debug('Debug information');
 * logger.info('User action');
 * logger.warn('Deprecation warning');
 * logger.error('Error occurred', error);
 * ```
 */

const isDev = import.meta.env.DEV;
const isDebug = import.meta.env.PUBLIC_DEBUG === 'true';
const _isProduction = import.meta.env.PROD;

/**
 * Logger interface with different log levels
 */
export const logger = {
  /**
   * Debug logs - only shown in development or when DEBUG=true
   * Use for detailed debugging information
   */
  debug: (...args: unknown[]): void => {
    if (isDev || isDebug) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - shown in development
   * Use for informational messages
   */
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - always shown
   * Use for deprecation warnings, non-critical issues
   */
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - always shown
   * Use for errors that need attention
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Group logs - creates a collapsible group in console
   * Only in development
   */
  group: (label: string, fn: () => void): void => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },

  /**
   * Table logs - displays data as a table
   * Only in development
   */
  table: (data: unknown): void => {
    if (isDev) {
      console.table(data);
    }
  },
};

/**
 * Performance logger - for performance-related logs
 * Only logs in development or when explicitly enabled
 */
export const perfLogger = {
  /**
   * Log performance metric
   */
  metric: (name: string, value: number, unit: string = 'ms'): void => {
    if (isDev || isDebug) {
      console.debug(`[PERF] ${name}: ${value}${unit}`);
    }
  },

  /**
   * Start performance timer
   */
  start: (label: string): (() => void) => {
    if (isDev || isDebug) {
      const startTime = performance.now();
      console.debug(`[PERF] Start: ${label}`);
      return () => {
        const duration = performance.now() - startTime;
        console.debug(`[PERF] End: ${label} (${duration.toFixed(2)}ms)`);
      };
    }
    return () => {}; // No-op in production
  },
};

/**
 * Analytics logger - for analytics/tracking logs
 * Only logs in development
 */
export const analyticsLogger = {
  track: (event: string, properties?: Record<string, unknown>): void => {
    if (isDev) {
      console.debug('[ANALYTICS]', event, properties);
    }
  },
};


