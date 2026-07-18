import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AchievementCard', () => {
  const filePath = resolve(__dirname, '../../src/components/features/about/AchievementCard.astro');
  const fileContent = readFileSync(filePath, 'utf8');

  it('uses container queries instead of viewport sm: text utilities', () => {
    expect(fileContent).toContain('@container');
    expect(fileContent).toContain('@sm:text-');
    expect(fileContent).not.toMatch(/(?<!@)sm:text-/);
  });
});
