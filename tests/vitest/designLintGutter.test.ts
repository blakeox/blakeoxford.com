import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { DESIGN_LINT_GUTTER_PATTERNS } from '../../scripts/quality/design-lint.js';

const { HARD_GUTTER_REGEX, HARD_GUTTER_NEAR_MISS_REGEX, SHARED_FEATURE_SELECTOR_REGEX } =
  DESIGN_LINT_GUTTER_PATTERNS;

describe('design-lint gutter patterns', () => {
  it('keeps shared page shells on section spacing tokens', () => {
    const root = resolve(__dirname, '../..');
    const shells = [
      'src/components/composites/PageHero.astro',
      'src/components/composites/CtaBand.astro',
      'src/components/features/projects/ProjectHero.astro',
    ];

    for (const file of shells) {
      const source = readFileSync(resolve(root, file), 'utf-8');
      expect(source, `${file} should use the section spacing contract`).toContain('py-section-');
      expect(source, `${file} should not reintroduce raw section ladders`).not.toMatch(
        /py-14|sm:py-16|md:py-20|lg:py-24/
      );
    }
  });

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

  it('keeps chat and command-center styles beside their owning features', () => {
    const root = resolve(__dirname, '../..');
    const sharedStyles = readFileSync(resolve(root, 'src/styles/components.css'), 'utf-8');
    const cssBudgets = [
      { file: 'src/styles/components.css', role: 'shared runtime', bytes: 8 * 1024 },
      { file: 'src/features/chat/chat.css', role: 'chat feature', bytes: 4 * 1024 },
      {
        file: 'src/features/command-center/command-center.css',
        role: 'command-center feature',
        bytes: 4 * 1024,
      },
    ];

    SHARED_FEATURE_SELECTOR_REGEX.lastIndex = 0;
    expect(sharedStyles).not.toMatch(SHARED_FEATURE_SELECTOR_REGEX);
    expect(readFileSync(resolve(root, 'src/features/chat/chat.css'), 'utf-8')).toContain(
      '.ai-chat-panel'
    );
    expect(
      readFileSync(resolve(root, 'src/features/command-center/command-center.css'), 'utf-8')
    ).toContain('.command-center');

    for (const budget of cssBudgets) {
      expect(statSync(resolve(root, budget.file)).size, `${budget.role} CSS budget`).toBeLessThan(
        budget.bytes
      );
    }
  });
});
