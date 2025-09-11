#!/usr/bin/env node
/**
 * Generate simple flat SVG badges for mutation score & flakiness reliability.
 * Output: badges/mutation.svg, badges/flakiness.svg, badges/a11y.svg
 */
import fs from 'fs';
import path from 'path';

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
const root = process.cwd();
const outDir = path.join(root,'badges');
ensureDir(outDir);

function read(file){ try { return fs.readFileSync(path.join(root,file),'utf8'); } catch { return null; } }

function colorScaleMutation(score){
  if (score >= 90) return '#2e7d32';
  if (score >= 80) return '#558b2f';
  if (score >= 70) return '#f9a825';
  if (score >= 60) return '#fb8c00';
  return '#c62828';
}
function colorScaleFlakiness(intensity){
  if (intensity <= 0.01) return '#2e7d32';
  if (intensity <= 0.02) return '#558b2f';
  if (intensity <= 0.04) return '#f9a825';
  if (intensity <= 0.06) return '#fb8c00';
  return '#c62828';
}
function colorScaleA11y(total){
  if (total === 0) return '#2e7d32';
  if (total <= 2) return '#558b2f';
  if (total <= 5) return '#f9a825';
  if (total <= 8) return '#fb8c00';
  return '#c62828';
}

function svgBadge(label, value, color){
  const labelWidth = 6 * label.length + 10;
  const valueWidth = 6 * value.length + 10;
  const total = labelWidth + valueWidth;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${total}' height='20' role='img' aria-label='${label}: ${value}'>
<linearGradient id='s' x2='0' y2='100%'><stop offset='0' stop-color='#fff' stop-opacity='.7'/><stop offset='1' stop-opacity='.7'/></linearGradient>
<rect rx='3' width='${total}' height='20' fill='#555'/>
<rect rx='3' x='${labelWidth}' width='${valueWidth}' height='20' fill='${color}'/>
<rect rx='3' width='${total}' height='20' fill='url(#s)'/>
<g fill='#fff' text-anchor='middle' font-family='Verdana,Geneva,DejaVu Sans,sans-serif' font-size='11'>
<text x='${labelWidth/2}' y='15'>${label}</text>
<text x='${labelWidth + valueWidth/2}' y='15'>${value}</text>
</g></svg>`;
}

// Mutation
let mutationScore = null;
const quality = read('quality-summary.md');
if (quality){
  const m = quality.match(/Mutation Score[^0-9]*([0-9]+(?:\.[0-9]+)?)/i);
  if (m) mutationScore = parseFloat(m[1]);
}
if (mutationScore != null){
  const svg = svgBadge('mutation', mutationScore.toFixed(1)+'%', colorScaleMutation(mutationScore));
  fs.writeFileSync(path.join(outDir,'mutation.svg'), svg, 'utf8');
  console.log(`[badges] mutation=${mutationScore.toFixed(1)}%`);
} else {
  const svg = svgBadge('mutation','n/a','#6c757d');
  fs.writeFileSync(path.join(outDir,'mutation.svg'), svg, 'utf8');
  console.log('[badges] mutation score not found (emitted n/a)');
}

// Flakiness (retry intensity) & Reliability (pass rate)
let retryIntensity = null;
let passRateLabel = null;
try {
  const fhRaw = read('flakiness-history.json') || read('.cache/quality/flakiness-history.json');
  if (fhRaw){
    const fh = JSON.parse(fhRaw);
    if (fh && Array.isArray(fh.runs) && fh.runs.length){
      const latest = fh.runs[fh.runs.length -1];
      if (typeof latest.retryIntensity === 'number') retryIntensity = latest.retryIntensity;
      if (typeof latest.passRate === 'number') passRateLabel = (latest.passRate * 100).toFixed(1) + '%';
    }
  }
} catch { /* ignore parse errors */ }
if (retryIntensity != null){
  const labelVal = (retryIntensity*100).toFixed(2)+'%';
  const svg = svgBadge('flakiness', labelVal, colorScaleFlakiness(retryIntensity));
  fs.writeFileSync(path.join(outDir,'flakiness.svg'), svg, 'utf8');
  console.log(`[badges] flakiness retryIntensity=${labelVal}`);
} else {
  const svg = svgBadge('flakiness','n/a','#6c757d');
  fs.writeFileSync(path.join(outDir,'flakiness.svg'), svg, 'utf8');
  console.log('[badges] flakiness retry intensity not available (emitted n/a)');
}

if (passRateLabel){
  const reliabilityColor = (p => {
    const val = parseFloat(p);
    if (val >= 99.5) return '#2e7d32';
    if (val >= 98.0) return '#558b2f';
    if (val >= 95.0) return '#f9a825';
    if (val >= 90.0) return '#fb8c00';
    return '#c62828';
  })(passRateLabel);
  const svg = svgBadge('reliability', passRateLabel, reliabilityColor);
  fs.writeFileSync(path.join(outDir,'reliability.svg'), svg, 'utf8');
  console.log(`[badges] reliability passRate=${passRateLabel}`);
}

// Accessibility (total violations from latest run)
try {
  const a11yRaw = read('accessibility-history.json');
  let total = null;
  if (a11yRaw){
    const history = JSON.parse(a11yRaw);
    const last = Array.isArray(history) && history.length ? history[history.length-1] : null;
    if (last){
      if (last.totals && typeof last.totals.count === 'number') {
        total = last.totals.count;
      } else if (Array.isArray(last.pages)) {
        total = last.pages.reduce((acc,p)=> acc + (typeof p.violations==='number' && p.violations>0 ? p.violations : 0), 0);
      }
    }
  }
  if (total != null){
    const svg = svgBadge('a11y', String(total), colorScaleA11y(total));
    fs.writeFileSync(path.join(outDir,'a11y.svg'), svg, 'utf8');
    console.log(`[badges] a11y total=${total}`);
  } else {
    const svg = svgBadge('a11y','n/a','#6c757d');
    fs.writeFileSync(path.join(outDir,'a11y.svg'), svg, 'utf8');
    console.log('[badges] a11y not available (emitted n/a)');
  }
} catch {
  const svg = svgBadge('a11y','n/a','#6c757d');
  fs.writeFileSync(path.join(outDir,'a11y.svg'), svg, 'utf8');
  console.log('[badges] a11y parse error (emitted n/a)');
}
