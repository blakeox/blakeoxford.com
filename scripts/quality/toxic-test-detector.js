#!/usr/bin/env node
/**
 * Toxic Test Detector
 * Ranks tests by (normalized retries + failures + duration weight).
 */
import fs from 'fs';

const file = 'flakiness-history.json';
if (!fs.existsSync(file)) {
  console.log('[toxic] no flakiness-history.json');
  process.exit(0);
}
const hist = JSON.parse(fs.readFileSync(file,'utf-8'));

function score(t){
  const runs = t.runs || 1;
  const retryRate = (t.totalRetries || 0) / runs; // avg retries per run
  const failRate = (t.failures || 0) / runs;
  const avgDuration = (t.totalDuration || 0) / runs; // ms
  // weights: retries 0.4, failRate 0.4, duration scaled 0.2 (>=3000ms saturates)
  const durationScore = Math.min(1, avgDuration / 3000);
  return retryRate*0.4 + failRate*0.4 + durationScore*0.2;
}

const ranked = hist.filter(t=> (t.runs||0) > 0).map(t=> ({ id: t.id, score: score(t), runs: t.runs, avgRetries: (t.totalRetries||0)/(t.runs||1), avgDuration: ((t.totalDuration||0)/(t.runs||1)).toFixed(1), failRate: ((t.failures||0)/(t.runs||1)).toFixed(2) })).sort((a,b)=> b.score - a.score).slice(0,10);

fs.writeFileSync('toxic-tests.json', JSON.stringify(ranked,null,2));
console.log('[toxic] top offenders');
ranked.forEach(r=> console.log(`  - ${r.id} score=${r.score.toFixed(3)} retries=${r.avgRetries.toFixed(2)} failRate=${r.failRate} avgDuration=${r.avgDuration}ms`));
