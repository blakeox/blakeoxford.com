/**
 * Utility Functions Library
 * Centralized utilities for date formatting, string manipulation, and common operations
 */

// ─── Date Formatting Utilities ───────────────────────────────────────

/**
 * Format a date as ISO string for datetime attributes
 * @example formatDateISO(new Date()) // "2025-10-10T15:30:00.000Z"
 */
export function formatDateISO(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Format a date for display (e.g., "Oct 2025")
 * @example formatDateShort(new Date()) // "Oct 2025"
 */
export function formatDateShort(date: Date | string | number): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date with full details (e.g., "October 10, 2025")
 * @example formatDateFull(new Date()) // "October 10, 2025"
 */
export function formatDateFull(date: Date | string | number): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date with day for blog posts (e.g., "Oct 10, 2025")
 * @example formatDateBlog(new Date()) // "Oct 10, 2025"
 */
export function formatDateBlog(date: Date | string | number): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Parse a date, returning current date as fallback
 * @example safeParseDate(data.date) // Date object or new Date()
 */
export function safeParseDate(date?: Date | string | number | null): Date {
  if (!date) return new Date();
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// ─── String Manipulation Utilities ───────────────────────────────────

/**
 * Truncate text to specified length with ellipsis
 * @example truncate("Long text here", 10) // "Long text..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Truncate text at word boundary
 * @example truncateWords("This is a long sentence", 3) // "This is a..."
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

/**
 * Remove trailing slash from path (except root)
 * @example normalizeTrailingSlash("/about/") // "/about"
 */
export function normalizeTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Generate a slug from text
 * @example slugify("Hello World!") // "hello-world"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter of string
 * @example capitalize("hello") // "Hello"
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ─── Array Utilities ──────────────────────────────────────────────────

/**
 * Get first N items from array
 * @example take([1,2,3,4,5], 3) // [1,2,3]
 */
export function take<T>(array: T[], count: number): T[] {
  return array.slice(0, count);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @example shuffle([1,2,3,4,5]) // [3,1,5,2,4]
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Group array items by key
 * @example groupBy([{type: 'a', val: 1}], item => item.type) // {a: [{type: 'a', val: 1}]}
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// ─── Number Utilities ─────────────────────────────────────────────────

/**
 * Clamp number between min and max
 * @example clamp(150, 0, 100) // 100
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate random integer between min and max (inclusive)
 * @example randomInt(1, 10) // 7
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format number with commas
 * @example formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// ─── URL & Path Utilities ─────────────────────────────────────────────

/**
 * Extract filename from path without extension
 * @example getBasename("/path/to/file.jpg") // "file"
 */
export function getBasename(path: string): string {
  const filename = path.split('/').pop() || '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.slice(0, lastDot);
}

/**
 * Get file extension from path
 * @example getExtension("/path/to/file.jpg") // "jpg"
 */
export function getExtension(path: string): string {
  const filename = path.split('/').pop() || '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Join URL segments safely
 * @example joinPath("/base", "path", "file") // "/base/path/file"
 */
export function joinPath(...segments: string[]): string {
  return segments
    .map((segment, index) => {
      // Remove leading slash from all but first segment
      if (index > 0 && segment.startsWith('/')) {
        segment = segment.slice(1);
      }
      // Remove trailing slash from all but last segment
      if (index < segments.length - 1 && segment.endsWith('/')) {
        segment = segment.slice(0, -1);
      }
      return segment;
    })
    .filter(Boolean)
    .join('/');
}

// ─── Validation Utilities ─────────────────────────────────────────────

/**
 * Check if email is valid format
 * @example isValidEmail("test@example.com") // true
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if URL is valid
 * @example isValidUrl("https://example.com") // true
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is not empty or whitespace
 * @example isNotEmpty("  test  ") // true
 */
export function isNotEmpty(str: string): boolean {
  return str.trim().length > 0;
}

// ─── Async Utilities ──────────────────────────────────────────────────

/**
 * Sleep for specified milliseconds
 * @example await sleep(1000) // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 * @example await retry(() => fetchData(), 3, 1000)
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await sleep(delayMs * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Debounce function calls
 * @example const debouncedFn = debounce(() => console.log('called'), 500)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

/**
 * Throttle function calls
 * @example const throttledFn = throttle(() => console.log('called'), 1000)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delayMs) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// ─── Object Utilities ─────────────────────────────────────────────────

/**
 * Deep clone an object
 * @example deepClone({a: {b: 1}}) // {a: {b: 1}} (new reference)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is plain object
 * @example isPlainObject({}) // true
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Omit keys from object
 * @example omit({a: 1, b: 2, c: 3}, 'b') // {a: 1, c: 3}
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Pick keys from object
 * @example pick({a: 1, b: 2, c: 3}, 'a', 'c') // {a: 1, c: 3}
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (result, key) => {
      if (key in obj) result[key] = obj[key];
      return result;
    },
    {} as Pick<T, K>
  );
}

// ─── Performance Utilities ────────────────────────────────────────────

/**
 * Measure execution time of a function
 * @example const [result, time] = await measureTime(async () => await fetch('/api'))
 */
export async function measureTime<T>(fn: () => Promise<T> | T): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return [result, duration];
}

/**
 * Memoize function results
 * @example const memoized = memoize((x) => expensiveComputation(x))
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

// ─── Class utilities ──────────────────────────────────────────────────

export { cn, type ClassValue } from './cn';

// ─── Re-exports ───────────────────────────────────────────────────────

// Error utilities
export {
  AppError,
  ErrorCodes,
  isAppError,
  createApiErrorFromResponse,
  createNetworkError,
  createChatError,
  isRetryableError,
  isNetworkError,
  getUserMessage,
  logError,
  type ErrorCode,
} from './errors';
