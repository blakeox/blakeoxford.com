/**
 * Lightweight className composer for Astro/React primitives.
 * Falsy values are dropped; arrays are flattened. No Tailwind conflict merge —
 * prefer controlled variant maps over competing utilities in one string.
 */
export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input && input !== 0) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input));
      continue;
    }
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    }
  }

  return out.join(' ').replace(/\s+/g, ' ').trim();
}
