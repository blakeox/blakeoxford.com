#!/usr/bin/env node
/**
 * Mutation threshold + ratchet gate.
 * Env:
 *  MUTATION_MIN_SCORE        Hard/soft minimum target (numeric)
 *  MUTATION_HARD_FAIL=1      Exit non-zero if below minimum OR ratchet violation
 *  MUTATION_BASELINE_FILE    Path to baseline json (default .mutation-baseline.json)
 *  MUTATION_ALLOW_DROP       Allowed drop below baseline before flag (default 0)
 *  MUTATION_UPDATE_BASELINE=1 Update baseline if score > stored baseline
 *  MUTATION_RATCHET_ONLY=1    Ignore MIN score; only enforce upward ratchet
 *
 * Baseline file format: { "baseline": <number> }
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const primary = path.join(root, 'mutation-report', 'report.json');
const alt = path.join(root, 'reports', 'mutation', 'report.json');
const target = fs.existsSync(primary) ? primary : (fs.existsSync(alt) ? alt : null);

if (!target) {
  console.log('ℹ️ No mutation report found; skipping threshold check.');
  process.exit(0);
}

let min = parseFloat(process.env.MUTATION_MIN_SCORE || '0');
const hard = process.env.MUTATION_HARD_FAIL === '1';
const baselinePath = path.join(root, process.env.MUTATION_BASELINE_FILE || '.mutation-baseline.json');
const allowDrop = parseFloat(process.env.MUTATION_ALLOW_DROP || '0');
const updateBaseline = process.env.MUTATION_UPDATE_BASELINE === '1';
const ratchetOnly = process.env.MUTATION_RATCHET_ONLY === '1';

try {
  const data = JSON.parse(fs.readFileSync(target, 'utf-8'));
  const killed = data.killed || data.metrics?.killed || 0;
  const total = data.totalMutants || data.metrics?.total || 0;
  const score = data.mutationScore ?? data.metrics?.mutationScore ?? (total ? (killed/total*100) : 0);
  console.log(`🧬 Mutation score: ${score}% (${killed}/${total} killed)`);

  // Load baseline
  let baselineVal = null;
  if (fs.existsSync(baselinePath)) {
    try { baselineVal = JSON.parse(fs.readFileSync(baselinePath, 'utf-8')).baseline; } catch { /* ignore */ }
  }
  if (baselineVal === null) baselineVal = 0;

  // Ratchet enforcement
  let fail = false;
  if (ratchetOnly) {
    const drop = baselineVal - score;
    if (drop > allowDrop) {
      console.warn(`⚠️ Score ${score}% below baseline ${baselineVal}% (drop ${drop} > allow ${allowDrop}).`);
      fail = true;
    } else {
      console.log(`✅ Ratchet check passed (baseline ${baselineVal}%, score ${score}%).`);
    }
  } else if (min > 0) {
    if (score < min) {
      console.warn(`⚠️ Mutation score ${score}% below threshold ${min}%.`);
      fail = true;
    } else {
      console.log(`✅ Mutation score meets threshold (${min}%).`);
    }
  } else {
    console.log('ℹ️ No minimum threshold set (MUTATION_MIN_SCORE).');
  }

  // Baseline update if improved
  if (updateBaseline && score > baselineVal) {
    try {
      fs.writeFileSync(baselinePath, JSON.stringify({ baseline: score }, null, 2));
      console.log(`⬆️  Baseline updated to ${score}% (${baselinePath}).`);
    } catch (e) {
      console.warn('⚠️ Failed to update baseline:', e.message);
    }
  }

  if (fail && hard) {
    console.error('❌ Failing due to mutation gate.');
    process.exit(1);
  } else if (fail) {
    console.warn('⚠️ Soft failure (not exiting).');
  }
} catch (e) {
  console.error('⚠️ Could not parse mutation report:', e.message);
  if (hard) process.exit(1);
}
