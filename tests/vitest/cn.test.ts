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
    expect(cn('  a  ', 'b   c')).toBe('a b c');
  });
});
