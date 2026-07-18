#!/usr/bin/env node
/**
 * Auto-close open contrast governance issues once stability achieved.
 * Logic: if last N days (default 3 via CONTRAST_AUTO_CLOSE_DAYS) have borderline = 0
 * and an open issue exists with title containing 'Contrast borderline threshold exceeded', close it.
 * Uses GitHub CLI (gh) for API operations; expects GH_TOKEN environment provided in workflow.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'quality-snapshots', 'contrast-history.json');
const days = parseInt(process.env.CONTRAST_AUTO_CLOSE_DAYS || '3', 10);

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function isStable(history, window) {
  if (history.length < window) return false; // need full window
  const recent = history.slice(-window);
  return recent.every((e) => (e.summary?.borderline ?? 0) === 0);
}

async function main() {
  const history = loadHistory();
  if (!history.length) {
    console.log('[auto-close] No history present. Skipping.');
    return;
  }
  const stable = isStable(history, days);
  console.log(
    `[auto-close] Stability check over last ${days} days: ${stable ? 'stable (all zero)' : 'not stable'}`
  );
  if (!stable) return;

  // Use gh CLI to find open issues matching contrast alert title
  const { execSync } = await import('node:child_process');
  let issuesRaw;
  try {
    issuesRaw = execSync(
      'gh issue list --state open --search "Contrast borderline threshold exceeded in:title" --json number,title',
      { encoding: 'utf8' }
    );
  } catch (e) {
    console.error('[auto-close] Failed to list issues via gh CLI.', e.message);
    return;
  }
  let issues;
  try {
    issues = JSON.parse(issuesRaw);
  } catch {
    issues = [];
  }
  if (!issues.length) {
    console.log('[auto-close] No open contrast alert issues to close.');
    return;
  }
  for (const issue of issues) {
    try {
      execSync(
        `gh issue close ${issue.number} --comment "Auto-closed: ${days} consecutive days with zero borderline contrast items. ✅"`,
        { stdio: 'inherit' }
      );
    } catch (e) {
      console.error(`[auto-close] Failed to close issue #${issue.number}:`, e.message);
    }
  }
}

main();
