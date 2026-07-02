#!/usr/bin/env node
/**
 * Ensures design token documentation stays in sync when theme.css changes.
 *
 * Usage:
 *   node scripts/quality/check-theme-docs-sync.js
 *
 * Environment:
 *   BASE_REF - git ref to compare against (default: origin/main)
 */
import { execSync } from 'node:child_process';

const THEME_PATH = 'src/styles/theme.css';
const TOKENS_DOC_PATH = 'src/pages/design/tokens.astro';
const baseRef = process.env.BASE_REF || 'origin/main';

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

const changed = getChangedFiles();

if (!changed.includes(THEME_PATH)) {
  console.log('[theme-docs-sync] theme.css unchanged — OK');
  process.exit(0);
}

if (changed.includes(TOKENS_DOC_PATH)) {
  console.log('[theme-docs-sync] theme.css and tokens docs updated together — OK');
  process.exit(0);
}

console.error(
  `[theme-docs-sync] ${THEME_PATH} changed but ${TOKENS_DOC_PATH} was not updated.\n` +
    'Update the live token docs page or revert unrelated theme.css edits.',
);
process.exit(1);
