/**
 * Array helpers.
 * Prefer `@/utils/array` over the utils barrel.
 */

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
