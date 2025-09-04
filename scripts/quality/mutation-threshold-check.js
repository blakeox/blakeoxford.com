#!/usr/bin/env node
/**
 * Mutation threshold gate (soft/hard) driven by env vars.
 * Env:
 *  - MUTATION_MIN_SCORE (number) minimum acceptable score
 *  - MUTATION_HARD_FAIL=1 to exit non-zero if below
 * Looks for mutation-report/report.json else exits 0 with notice.
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

try {
  const data = JSON.parse(fs.readFileSync(target, 'utf-8'));
  const killed = data.killed || data.metrics?.killed || 0;
  const total = data.totalMutants || data.metrics?.total || 0;
  const score = data.mutationScore ?? data.metrics?.mutationScore ?? (total ? (killed/total*100) : 0);
  console.log(`🧬 Mutation score: ${score}% (${killed}/${total} killed)`);
  if (min > 0) {
    if (score < min) {
      const msg = `Mutation score ${score}% below threshold ${min}%`;
      if (hard) {
        console.error('❌ ' + msg + ' (hard fail)');
        process.exit(1);
      } else {
        console.warn('⚠️ ' + msg + ' (soft)');
      }
    } else {
      console.log(`✅ Mutation score meets threshold (${min}%).`);
    }
  } else {
    console.log('ℹ️ No minimum threshold set (MUTATION_MIN_SCORE).');
  }
} catch (e) {
  console.error('⚠️ Could not parse mutation report:', e.message);
  if (hard) process.exit(1);
}
