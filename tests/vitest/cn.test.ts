import { describe, expect, it } from 'vitest';

import { cn } from '../../src/utils/cn';

describe('cn', () => {
  it('joins truthy class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('flattens nested arrays', () => {
    expect(cn('a', ['b', false, ['c']])).toBe('a b c');
  });

  it('collapses extra whitespace', () => {
    expect(cn('a', 'b c')).toBe('a b c');
  });

  it('does not merge conflicting Tailwind utilities (no tailwind-merge)', () => {
    // Intentional policy: both classes are preserved. Resolve conflicts with
    // exclusive variant maps (see Button.astro), not by adding tailwind-merge.
    expect(cn('p-2', 'p-4')).toBe('p-2 p-4');
    expect(cn('px-2', 'p-4')).toBe('px-2 p-4');
  });
});
