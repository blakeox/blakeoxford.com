#!/usr/bin/env node
/**
 * Runs contrast token audit (reusing existing contrast-token-audit logic if possible) for light and dark themes.
 * Compares violation counts and outputs delta summary.
 * NOTE: Assumes site supports theme switching via [data-theme="dark"].
 */
import { execSync } from 'child_process';
import fs from 'fs';

function runAudit(theme) {
  // Reuse existing script if available by injecting THEME env or fallback command.
  try {
    const out = execSync(`THEME=${theme} node scripts/quality/contrast-token-audit.js`, { stdio: ['ignore','pipe','pipe'] }).toString();
    return out;
  } catch (e) {
    return e.stdout?.toString() || '';
  }
}

function extractViolations(output) {
  const m = output.match(/Violations?:\s*(\d+)/i);
  if (m) return parseInt(m[1],10);
  // Fallback: count lines containing '[contrast-fail]'
  return (output.match(/contrast-fail/gi) || []).length;
}

const light = runAudit('light');
const dark = runAudit('dark');
const lightV = extractViolations(light);
const darkV = extractViolations(dark);
const delta = darkV - lightV;

const summary = `[contrast:themes] light=${lightV} dark=${darkV} delta=${delta>0?`+${delta}`:delta}`;
console.log(summary);
fs.writeFileSync('contrast-theme-diff.txt', summary + '\n');
