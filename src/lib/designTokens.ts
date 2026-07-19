/**
 * Parse public design tokens from src/styles/theme.css.
 *
 * Source of truth for the live /design/tokens page and theme-docs sync gate.
 * Only tokens bridged in `@theme inline` are considered public utilities.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type TokenCategory =
  | 'color'
  | 'font'
  | 'text'
  | 'tracking'
  | 'radius'
  | 'shadow'
  | 'motion'
  | 'ease'
  | 'animate'
  | 'z-index'
  | 'layout'
  | 'other';

export interface ThemeToken {
  /** Full CSS custom property name, e.g. --color-accent */
  name: string;
  /** Token stem without namespace prefix, e.g. accent */
  stem: string;
  category: TokenCategory;
  /** Representative Tailwind utility when obvious */
  utility?: string;
}

const PRIVATE_COLOR_STEMS = new Set([
  'background-dark',
  'surface-dark',
  'surface-dark-subtle',
  'surface-elevated-dark',
  'foreground-light',
  'border-dark',
]);

/** Curated usage notes for the tokens page table (optional). */
export const SEMANTIC_COLOR_USAGE: Record<string, string> = {
  background: 'Page canvas (theme-aware)',
  surface: 'Cards, panels, controls',
  'surface-subtle': 'Quiet secondary panels',
  'surface-elevated': 'Elevated overlays',
  glass: 'Nav and chat translucent chrome',
  'overlay-scrim': 'Modal backdrops (always dark)',
  'code-surface': 'Always-dark code samples',
  'code-foreground': 'Text on code-surface',
  foreground: 'Primary readable text',
  'muted-foreground': 'Secondary body copy',
  'subtle-foreground': 'Labels and meta',
  border: 'Dividers and outlines',
  accent: 'Primary actions — pair with on-accent',
  'on-accent': 'Foreground paired with bg-accent / button-primary',
  'accent-subtle': 'Soft accent washes (theme-aware)',
  'accent-emphasis': 'Theme-aware accent text — prefer over dark: pairs',
  'primary-subtle': 'Soft primary washes (blur orbs)',
  'primary-emphasis': 'Theme-aware primary text',
};

function categorize(name: string): { category: TokenCategory; stem: string; utility?: string } {
  if (name.startsWith('--color-')) {
    const stem = name.slice('--color-'.length);
    const isTextToken =
      stem.includes('foreground') ||
      stem.startsWith('on-') ||
      stem.endsWith('-emphasis') ||
      stem.endsWith('-fg');
    const utility = isTextToken
      ? `text-${stem}`
      : stem === 'border'
        ? `border-${stem}`
        : `bg-${stem}`;
    return { category: 'color', stem, utility };
  }
  if (name.startsWith('--font-')) {
    const stem = name.slice('--font-'.length);
    return { category: 'font', stem, utility: `font-${stem}` };
  }
  if (name.startsWith('--text-')) {
    const stem = name.slice('--text-'.length);
    return { category: 'text', stem, utility: `text-${stem}` };
  }
  if (name.startsWith('--tracking-')) {
    const stem = name.slice('--tracking-'.length);
    return { category: 'tracking', stem, utility: `tracking-${stem}` };
  }
  if (name.startsWith('--radius-')) {
    const stem = name.slice('--radius-'.length);
    const utilStem = stem === 'DEFAULT' ? '' : stem;
    return { category: 'radius', stem, utility: utilStem ? `rounded-${utilStem}` : 'rounded' };
  }
  if (name.startsWith('--shadow-')) {
    const stem = name.slice('--shadow-'.length);
    const utilStem = stem === 'DEFAULT' ? '' : stem;
    return { category: 'shadow', stem, utility: utilStem ? `shadow-${utilStem}` : 'shadow' };
  }
  if (name.startsWith('--transition-duration-')) {
    const stem = name.slice('--transition-duration-'.length);
    const utilStem = stem === 'DEFAULT' ? '' : stem;
    return { category: 'motion', stem, utility: utilStem ? `duration-${utilStem}` : 'duration' };
  }
  if (name.startsWith('--ease-')) {
    const stem = name.slice('--ease-'.length);
    return { category: 'ease', stem, utility: `ease-${stem}` };
  }
  if (name.startsWith('--animate-')) {
    const stem = name.slice('--animate-'.length);
    return { category: 'animate', stem, utility: `animate-${stem}` };
  }
  if (name.startsWith('--z-index-')) {
    const stem = name.slice('--z-index-'.length);
    return { category: 'z-index', stem, utility: `z-${stem}` };
  }
  if (name.startsWith('--max-width-')) {
    const stem = name.slice('--max-width-'.length);
    return { category: 'layout', stem, utility: `max-w-${stem}` };
  }
  if (name.startsWith('--spacing-')) {
    const stem = name.slice('--spacing-'.length);
    return { category: 'layout', stem, utility: `p-${stem}` };
  }
  return { category: 'other', stem: name.replace(/^--/, '') };
}

export function extractThemeInlineBlock(themeCss: string): string {
  const start = themeCss.indexOf('@theme inline {');
  if (start === -1) return '';
  let depth = 0;
  let i = start + '@theme inline '.length;
  // Find opening brace
  while (i < themeCss.length && themeCss[i] !== '{') i += 1;
  const blockStart = i;
  for (; i < themeCss.length; i += 1) {
    const ch = themeCss[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return themeCss.slice(blockStart + 1, i);
    }
  }
  return '';
}

export function parsePublicThemeTokens(themeCss: string): ThemeToken[] {
  const block = extractThemeInlineBlock(themeCss);
  if (!block) return [];

  const tokens: ThemeToken[] = [];
  const seen = new Set<string>();
  const propRegex = /--([\w-]+)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = propRegex.exec(block))) {
    const name = `--${match[1]}`;
    if (seen.has(name)) continue;
    seen.add(name);
    const { category, stem, utility } = categorize(name);
    tokens.push({ name, stem, category, utility });
  }
  return tokens;
}

export function loadThemeCss(cwd = process.cwd()): string {
  return readFileSync(resolve(cwd, 'src/styles/theme.css'), 'utf8');
}

export function getPublicThemeTokens(cwd = process.cwd()): ThemeToken[] {
  return parsePublicThemeTokens(loadThemeCss(cwd));
}

export function getPublicColorTokens(cwd = process.cwd()): ThemeToken[] {
  return getPublicThemeTokens(cwd).filter((t) => t.category === 'color');
}

export function assertNoPrivateColorsBridged(tokens: ThemeToken[]): string[] {
  return tokens
    .filter((t) => t.category === 'color' && PRIVATE_COLOR_STEMS.has(t.stem))
    .map((t) => t.name);
}

export function groupTokensByCategory(tokens: ThemeToken[]): Record<TokenCategory, ThemeToken[]> {
  const groups = {
    color: [],
    font: [],
    text: [],
    tracking: [],
    radius: [],
    shadow: [],
    motion: [],
    ease: [],
    animate: [],
    'z-index': [],
    layout: [],
    other: [],
  } as Record<TokenCategory, ThemeToken[]>;

  for (const token of tokens) {
    groups[token.category].push(token);
  }
  return groups;
}
