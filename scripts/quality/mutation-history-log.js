#!/usr/bin/env node
/**
 * Append current mutation score to history file for trend reporting.
 * Run after mutation report generation but before generate-quality-summary.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const historyFile = path.join(root, 'mutation-history.json');
const primary = path.join(root, 'mutation-report', 'report.json');
const alt = path.join(root, 'reports', 'mutation', 'report.json');
const target = fs.existsSync(primary) ? primary : (fs.existsSync(alt) ? alt : null);

if (!target) {
  console.log('ℹ️ No mutation report found; skipping mutation history logging.');
  process.exit(0);
}

try {
  const data = JSON.parse(fs.readFileSync(target, 'utf-8'));
  const killed = data.killed || data.metrics?.killed || 0;
  const total = data.totalMutants || data.metrics?.total || 0;
  const score = data.mutationScore ?? data.metrics?.mutationScore ?? (total ? (killed/total*100) : 0);
  let history = [];
  if (fs.existsSync(historyFile)) {
    try { history = JSON.parse(fs.readFileSync(historyFile, 'utf-8')); } catch { history = []; }
  }
  history.push({ ts: new Date().toISOString(), score });
  // keep last 200 entries max
  if (history.length > 200) history = history.slice(-200);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  console.log(`🧬 Logged mutation score ${score}% to history (${history.length} entries).`);
} catch (e) {
  console.warn('⚠️ Failed to append mutation history:', e.message);
}
