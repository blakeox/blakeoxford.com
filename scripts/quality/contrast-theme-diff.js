#!/usr/bin/env node
/**
 * Retired theme-diff wrapper around the old hex contrast-token-audit.
 *
 * Prefer Playwright contrast coverage (`pnpm audit:contrast`) and the live
 * pairs on /design/tokens for light/dark checks.
 */
import fs from 'fs';

const summary =
  '[contrast:themes] retired — use `pnpm audit:contrast` and /design/tokens (light/dark)';
console.log(summary);
fs.writeFileSync('contrast-theme-diff.txt', summary + '\n');
