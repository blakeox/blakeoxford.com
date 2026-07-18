#!/usr/bin/env node
/**
 * Ensures public design tokens stay valid and documentable.
 *
 * Checks:
 * 1. `@theme inline` in theme.css exposes a non-empty public token set
 * 2. Private remap colors (*-dark / *-light palette helpers) are not bridged
 * 3. When theme.css changes vs BASE_REF, tokens docs still build from the parser
 *    (tokens.astro imports designTokens — no manual table sync required)
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
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = process.cwd();
const THEME_PATH = 'src/styles/theme.css';
const TOKENS_DOC_PATH = 'src/pages/design/tokens.astro';
const DESIGN_TOKENS_PATH = 'src/lib/designTokens.ts';
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

function loadDesignTokenHelpers() {
  const sourcePath = path.join(root, DESIGN_TOKENS_PATH);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  const requireFn = createRequire(import.meta.url);
  const wrapper = new Function('exports', 'require', 'module', '__filename', '__dirname', transpiled);
  wrapper(module.exports, requireFn, module, sourcePath, path.dirname(sourcePath));
  return module.exports;
}

const {
  parsePublicThemeTokens,
  assertNoPrivateColorsBridged,
  loadThemeCss,
} = loadDesignTokenHelpers();

const themeCss = loadThemeCss(root);
const tokens = parsePublicThemeTokens(themeCss);
const privateBridged = assertNoPrivateColorsBridged(tokens);

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
    `[theme-docs-sync] ${TOKENS_DOC_PATH} must import public tokens from src/lib/designTokens.ts`,
  );
  process.exit(1);
}

const colorCount = tokens.filter((t) => t.category === 'color').length;
console.log(
  `[theme-docs-sync] OK — ${tokens.length} public tokens (${colorCount} colors); private remap stems stay unbridged`,
);

const changed = getChangedFiles();
if (changed.includes(THEME_PATH)) {
  console.log(
    `[theme-docs-sync] ${THEME_PATH} changed — tokens page auto-lists from @theme inline (no manual table edit required)`,
  );
}

// Keep PRIVATE_COLOR_STEMS local copy aligned with the TS module (sanity).
for (const stem of PRIVATE_COLOR_STEMS) {
  if (tokens.some((t) => t.category === 'color' && t.stem === stem)) {
    console.error(`[theme-docs-sync] Unexpected bridged private stem: ${stem}`);
    process.exit(1);
  }
}

process.exit(0);
