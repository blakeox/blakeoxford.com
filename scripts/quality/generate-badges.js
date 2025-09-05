#!/usr/bin/env node
/**
 * Generate simple flat SVG badges for mutation score & flakiness reliability.
 * Output: badges/mutation.svg, badges/flakiness.svg
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
  console.log('[badges] mutation score not found');
}

// Flakiness (retry intensity)
let retryIntensity = null;
try {
  const fhRaw = read('flakiness-history.json');
  if (fhRaw){
    const fh = JSON.parse(fhRaw);
    let totalRetries=0,totalRuns=0;
    fh.forEach(r=>{ totalRetries += r.totalRetries||0; totalRuns += r.runs||0; });
    if (totalRuns>0) retryIntensity = totalRetries/totalRuns;
  }
} catch { /* ignore parse errors */ }
if (retryIntensity != null){
  const labelVal = (retryIntensity*100).toFixed(2)+'%';
  const svg = svgBadge('flakiness', labelVal, colorScaleFlakiness(retryIntensity));
  fs.writeFileSync(path.join(outDir,'flakiness.svg'), svg, 'utf8');
  console.log(`[badges] flakiness retryIntensity=${labelVal}`);
} else {
  console.log('[badges] flakiness retry intensity not available');
}
