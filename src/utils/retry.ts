/**
 * Retry Utility
 * 
 * Provides retry logic for async operations with exponential backoff.
 * Useful for API calls, network requests, and other operations that may fail transiently.
 * 
 * @example Basic retry
 * ```typescript
 * import { retry } from '@/utils/retry';
 * 
 * const result = await retry(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3 }
 * );
 * ```
 * 
 * @example With custom backoff
 * ```typescript
 * const result = await retry(
 *   () => apiCall(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 1000,
 *     maxDelay: 10000,
 *     backoffMultiplier: 2,
 *   }
 * );
 * ```
 */

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Custom retry condition (default: retry on any error) */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Result of the async function
 * @throws Last error if all attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt >= maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      // Wait before retrying
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  // All attempts failed, throw last error
  throw lastError;
}

/**
 * Retry condition: only retry on network errors or 5xx status codes
 */
export function shouldRetryNetworkError(error: unknown, _attempt: number): boolean {
  // Don't retry on 4xx errors (client errors)
  if (error instanceof Error && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  // Retry on network errors or 5xx errors
  return true;
}

/**
 * Retry condition: retry on any error
 */
export function shouldRetryAllErrors(): boolean {
  return true;
}

