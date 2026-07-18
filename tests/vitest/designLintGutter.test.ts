import { describe, expect, it } from 'vitest';

import { DESIGN_LINT_GUTTER_PATTERNS } from '../../scripts/quality/design-lint.js';

const { HARD_GUTTER_REGEX, HARD_GUTTER_NEAR_MISS_REGEX } = DESIGN_LINT_GUTTER_PATTERNS;

describe('design-lint gutter patterns', () => {
  it('flags the classic px-4 sm:px-6 lg:px-8 ladder', () => {
    const sample = 'class="mx-auto px-4 sm:px-6 lg:px-8"';
    HARD_GUTTER_REGEX.lastIndex = 0;
    expect(HARD_GUTTER_REGEX.test(sample)).toBe(true);
  });

  it('flags ProjectRow-style md/lg padding ladders', () => {
    const sample = 'class="flex-1 px-4 md:px-6 lg:px-12 py-4"';
    HARD_GUTTER_REGEX.lastIndex = 0;
    expect(HARD_GUTTER_REGEX.test(sample)).toBe(true);
  });

  it('flags AboutHero-style near-miss ladders with intervening utilities', () => {
    const sample =
      'class="order-1 flex px-4 pb-8 pt-28 sm:px-6 md:order-1 md:px-6 md:py-16 lg:px-12"';
    HARD_GUTTER_NEAR_MISS_REGEX.lastIndex = 0;
    expect(HARD_GUTTER_NEAR_MISS_REGEX.test(sample)).toBe(true);
  });

  it('allows layout-gutter without a padding ladder', () => {
    const sample = 'class="layout-gutter pb-8 pt-28 md:py-16"';
    HARD_GUTTER_REGEX.lastIndex = 0;
    HARD_GUTTER_NEAR_MISS_REGEX.lastIndex = 0;
    expect(HARD_GUTTER_REGEX.test(sample)).toBe(false);
    expect(HARD_GUTTER_NEAR_MISS_REGEX.test(sample)).toBe(false);
  });

  it('allows bare px-4 shells without responsive px companions', () => {
    const sample = 'class="mx-auto max-w-3xl px-4 py-6"';
    HARD_GUTTER_REGEX.lastIndex = 0;
    HARD_GUTTER_NEAR_MISS_REGEX.lastIndex = 0;
    expect(HARD_GUTTER_REGEX.test(sample)).toBe(false);
    expect(HARD_GUTTER_NEAR_MISS_REGEX.test(sample)).toBe(false);
  });
});
