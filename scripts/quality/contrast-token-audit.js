#!/usr/bin/env node
/**
 * Retired hex-token contrast scanner.
 *
 * Design tokens in theme.css are OKLCH (and color-mix), not hex — this script
 * previously only scanned leftover hex custom properties and was a no-op.
 *
 * Use instead:
 * - Live WCAG pairs on /design/tokens (tokenLiveValues.ts)
 * - Playwright: `pnpm audit:contrast`
 */
console.log(
  'contrast-token-audit: retired. Tokens are OKLCH — use /design/tokens and `pnpm audit:contrast`.'
);
process.exit(0);
