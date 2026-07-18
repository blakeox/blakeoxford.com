import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('TimelineCard', () => {
  const filePath = resolve(__dirname, '../../src/components/features/about/TimelineCard.astro');
  const fileContent = readFileSync(filePath, 'utf8');

  it('enables containerQuery and uses @sm typography', () => {
    expect(fileContent).toMatch(/containerQuery/);
    expect(fileContent).toContain('@sm:text-');
    expect(fileContent).not.toMatch(/(?<!@)sm:text-/);
  });

  it('gates decorative hover translate with motion-safe', () => {
    expect(fileContent).toContain('motion-safe:hover:translate-x-1');
  });
});

describe('TimelineCardMobile', () => {
  const filePath = resolve(
    __dirname,
    '../../src/components/features/about/TimelineCardMobile.astro'
  );
  const fileContent = readFileSync(filePath, 'utf8');

  it('uses container queries instead of viewport sm: text utilities', () => {
    expect(fileContent).toContain('@container');
    expect(fileContent).toContain('@sm:text-');
    expect(fileContent).not.toMatch(/(?<!@)sm:text-/);
  });

  it('uses semantic accent shadow instead of raw emerald palette', () => {
    expect(fileContent).toContain('hover:shadow-accent/10');
    expect(fileContent).not.toMatch(/shadow-emerald/);
  });
});
