/**
 * Date formatting helpers.
 * Prefer `@/utils/date` over the utils barrel.
 */

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
