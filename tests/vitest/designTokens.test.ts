import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertNoPrivateColorsBridged,
  extractThemeInlineBlock,
  getPublicThemeTokens,
  parsePublicThemeTokens,
} from '../../src/lib/designTokens';

describe('design token parser', () => {
  const themeCss = readFileSync(resolve(__dirname, '../../src/styles/theme.css'), 'utf8');

  it('extracts the @theme inline block', () => {
    const block = extractThemeInlineBlock(themeCss);
    expect(block).toContain('--color-accent');
    expect(block).toContain('--max-width-container-2xl');
  });

  it('parses public tokens including colors and layout', () => {
    const tokens = parsePublicThemeTokens(themeCss);
    expect(tokens.length).toBeGreaterThan(40);
    expect(tokens.some((t) => t.name === '--color-accent')).toBe(true);
    expect(
      tokens.some(
        (t) => t.name === '--max-width-container-2xl' && t.utility === 'max-w-container-2xl'
      )
    ).toBe(true);
  });

  it('maps emphasis and fg color stems to text utilities', () => {
    const tokens = parsePublicThemeTokens(themeCss);
    const accentEmphasis = tokens.find((t) => t.name === '--color-accent-emphasis');
    const buttonFg = tokens.find((t) => t.name === '--color-button-primary-fg');
    expect(accentEmphasis?.utility).toBe('text-accent-emphasis');
    expect(buttonFg?.utility).toBe('text-button-primary-fg');
  });

  it('does not bridge private remap color stems', () => {
    const tokens = getPublicThemeTokens();
    expect(assertNoPrivateColorsBridged(tokens)).toEqual([]);
    expect(tokens.some((t) => t.name === '--color-background-dark')).toBe(false);
    expect(tokens.some((t) => t.name === '--color-foreground-light')).toBe(false);
  });
});

describe('Prose primitive', () => {
  it('encodes the article prose recipe', () => {
    const prose = readFileSync(
      resolve(__dirname, '../../src/components/primitives/Prose.astro'),
      'utf8'
    );
    expect(prose).toContain('prose-headings:font-heading');
    expect(prose).toContain('prose-a:text-accent-emphasis');
    expect(prose).toContain("size = 'xl'");
  });

  it('is used by the blog slug page', () => {
    const slug = readFileSync(resolve(__dirname, '../../src/pages/blog/[slug].astro'), 'utf8');
    expect(slug).toContain("import Prose from '../../components/primitives/Prose.astro'");
    expect(slug).toContain('<Prose>');
    expect(slug).not.toContain('prose-h1:text-5xl');
  });
});
