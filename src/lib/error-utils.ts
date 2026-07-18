/**
 * Error handling and categorization utilities
 */

/**
 * Categorize an error for better handling and user messaging
 * @param err - Error object or unknown error
 * @returns Categorized error information
 */
export function categorizeError(err: unknown): {
  category: 'network' | 'timeout' | 'auth' | 'rate-limit' | 'server' | 'unknown';
  severity: 'low' | 'medium' | 'high';
  message: string;
  retryable: boolean;
  userMessage: string;
  retryAfterSec?: number;
} {
  const error = err as Error & { status?: number; code?: string; retryAfterSec?: number };

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      category: 'network',
      severity: 'medium',
      message: 'Network connection failed',
      retryable: true,
      userMessage: 'Unable to connect. Please check your internet connection and try again.',
    };
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      category: 'timeout',
      severity: 'medium',
      message: 'Request timed out',
      retryable: true,
      userMessage: 'The request took too long. Please try again with a simpler query.',
    };
  }

  // Auth errors
  if (error.status === 401 || error.status === 403) {
    return {
      category: 'auth',
      severity: 'high',
      message: 'Authentication failed',
      retryable: false,
      userMessage: 'Access denied. Please refresh the page and try again.',
    };
  }

  // Rate limit errors
  if (error.status === 429 || /rate limit|too many/i.test(error.message || '')) {
    const wait =
      typeof error.retryAfterSec === 'number' && error.retryAfterSec > 0
        ? Math.ceil(error.retryAfterSec)
        : undefined;
    return {
      category: 'rate-limit',
      severity: 'medium',
      message: 'Rate limit exceeded',
      retryable: false,
      retryAfterSec: wait,
      userMessage: wait
        ? `Too many requests on the edge. Please wait ${wait}s and try again.`
        : 'Too many requests on the edge. Please wait a moment and try again.',
    };
  }

  // Server errors
  if (error.status && error.status >= 500) {
    return {
      category: 'server',
      severity: 'high',
      message: 'Server error',
      retryable: true,
      userMessage: 'Server encountered an error. Please try again in a moment.',
    };
  }

  // Unknown errors
  return {
    category: 'unknown',
    severity: 'medium',
    message: error.message || 'Unknown error occurred',
    retryable: true,
    userMessage: 'Something went wrong. Please try again.',
  };
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 * @param attempt - Retry attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}

/**
 * Check if error is retryable
 * @param err - Error object
 * @returns True if error should be retried
 */
export function isRetryableError(err: unknown): boolean {
  const { retryable } = categorizeError(err);
  return retryable;
}
