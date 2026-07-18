#!/usr/bin/env node
/**
 * Ensures public design tokens stay valid and documentable.
 *
 * Zero-dependency (no TypeScript transpile) so CI workflows that skip
 * `pnpm install` can still run this gate.
 *
 * Checks:
 * 1. `@theme inline` in theme.css exposes a non-empty public token set
 * 2. Private remap colors are not bridged
 * 3. tokens.astro imports the designTokens parser
 *
 * Usage:
 *   node scripts/quality/check-theme-docs-sync.js
 *
 * Environment:
 *   BASE_REF - git ref to compare against (default: origin/main)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const THEME_PATH = 'src/styles/theme.css';
const TOKENS_DOC_PATH = 'src/pages/design/tokens.astro';
const baseRef = process.env.BASE_REF || 'origin/main';

const PRIVATE_COLOR_STEMS = new Set([
  'background-dark',
  'surface-dark',
  'surface-dark-subtle',
  'surface-elevated-dark',
  'foreground-light',
  'border-dark',
]);

function getChangedFiles() {
  try {
    const output = execSync(`git diff --name-only ${baseRef}...HEAD`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function extractThemeInlineBlock(themeCss) {
  const start = themeCss.indexOf('@theme inline {');
  if (start === -1) return '';
  let depth = 0;
  let i = start + '@theme inline '.length;
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

function parsePublicThemeTokens(themeCss) {
  const block = extractThemeInlineBlock(themeCss);
  if (!block) return [];

  const tokens = [];
  const seen = new Set();
  const propRegex = /--([\w-]+)\s*:/g;
  let match;
  while ((match = propRegex.exec(block))) {
    const name = `--${match[1]}`;
    if (seen.has(name)) continue;
    seen.add(name);
    const category = name.startsWith('--color-')
      ? 'color'
      : name.startsWith('--font-')
        ? 'font'
        : name.startsWith('--text-')
          ? 'text'
          : name.startsWith('--tracking-')
            ? 'tracking'
            : name.startsWith('--radius-')
              ? 'radius'
              : name.startsWith('--shadow-')
                ? 'shadow'
                : name.startsWith('--transition-duration-')
                  ? 'motion'
                  : name.startsWith('--ease-')
                    ? 'ease'
                    : name.startsWith('--animate-')
                      ? 'animate'
                      : name.startsWith('--z-index-')
                        ? 'z-index'
                        : name.startsWith('--max-width-')
                          ? 'layout'
                          : 'other';
    const stem = name.replace(
      /^--(?:color|font|text|tracking|radius|shadow|transition-duration|ease|animate|z-index|max-width)-/,
      ''
    );
    tokens.push({ name, stem, category });
  }
  return tokens;
}

const themeCss = fs.readFileSync(path.join(root, THEME_PATH), 'utf8');
const tokens = parsePublicThemeTokens(themeCss);
const privateBridged = tokens
  .filter((t) => t.category === 'color' && PRIVATE_COLOR_STEMS.has(t.stem))
  .map((t) => t.name);

if (!tokens.length) {
  console.error('[theme-docs-sync] No public tokens found in @theme inline — check theme.css');
  process.exit(1);
}

if (privateBridged.length) {
  console.error('[theme-docs-sync] Private remap colors must not be bridged in @theme inline:');
  for (const name of privateBridged) console.error(`  ${name}`);
  process.exit(1);
}

const tokensDoc = fs.readFileSync(path.join(root, TOKENS_DOC_PATH), 'utf8');
if (!tokensDoc.includes('getPublicThemeTokens') && !tokensDoc.includes('designTokens')) {
  console.error(
    `[theme-docs-sync] ${TOKENS_DOC_PATH} must import public tokens from src/lib/designTokens.ts`
  );
  process.exit(1);
}

const colorCount = tokens.filter((t) => t.category === 'color').length;
console.log(
  `[theme-docs-sync] OK — ${tokens.length} public tokens (${colorCount} colors); private remap stems stay unbridged`
);

const changed = getChangedFiles();
if (changed.includes(THEME_PATH)) {
  console.log(
    `[theme-docs-sync] ${THEME_PATH} changed — tokens page auto-lists from @theme inline (no manual table edit required)`
  );
}

process.exit(0);
