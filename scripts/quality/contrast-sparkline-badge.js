#!/usr/bin/env node
/**
 * Generates a minimalist SVG sparkline of total sampled vs borderline counts
 * over time from contrast-history.json and writes badges/contrast.svg
 * TODO: Incorporate rolling 7-day borderline average & slope indicators (arrows / color cue)
 */
import fs from 'fs';
import path from 'path';
import { rollingAverage, classifyTrend } from './lib/contrastMetrics.js';

const ROOT = process.cwd();
const HISTORY_PATH = path.join(ROOT, 'quality-snapshots', 'contrast-history.json');
const OUTPUT = path.join(ROOT, 'badges', 'contrast.svg');

if (!fs.existsSync(HISTORY_PATH)) {
  console.error('contrast-sparkline-badge: no history file');
  process.exit(0);
}
const history = JSON.parse(fs.readFileSync(HISTORY_PATH,'utf8'));
if (!Array.isArray(history) || !history.length){
  console.error('contrast-sparkline-badge: empty history');
  process.exit(0);
}
// Build arrays
const sampledSeries = history.map(h => h.summary?.sampled || 0);
const borderlineSeries = history.map(h => h.summary?.borderline || 0);
// Compute rolling borderline series (aligned; only plot for points having enough history if desired)
const rollingWindow = 7;
const rollingSeries = borderlineSeries.map((_, idx) => {
  const slice = borderlineSeries.slice(0, idx + 1);
  return rollingAverage(slice, rollingWindow) ?? 0;
});

function normalize(series, height){
  const max = Math.max(...series, 1);
  return series.map(v => height - (v / max) * (height - 2) - 1); // padding
}

const width = 200;
const height = 40;
const padLeft = 4;
const step = (width - padLeft) / Math.max(sampledSeries.length - 1, 1);

const sampledY = normalize(sampledSeries, height);
const borderlineY = normalize(borderlineSeries, height);
const rollingY = normalize(rollingSeries, height);

function linePath(yVals){
  return yVals.map((y,i)=>`${i===0?'M':'L'}${(padLeft + i*step).toFixed(1)},${y.toFixed(1)}`).join(' ');
}

const sampledPath = linePath(sampledY);
const borderlinePath = linePath(borderlineY);
const rollingPath = linePath(rollingY);

const latest = history[history.length-1];
const slope7 = latest.metrics?.slope7Borderline ?? null;
const trendClass = classifyTrend(slope7, 0.02);
const arrow = trendClass === 'worsening' ? '▲' : trendClass === 'improving' ? '▼' : '⭮';
const label = `Contrast (borderline ${latest.summary?.borderline||0} ${arrow})`;

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' role='img' aria-label='${label}'>
  <title>${label}</title>
  <rect width='100%' height='100%' rx='4' fill='#1e1e1e'/>
  <path d='${sampledPath}' fill='none' stroke='#4ade80' stroke-width='2'/>
  <path d='${borderlinePath}' fill='none' stroke='#f87171' stroke-width='2'/>
  <path d='${rollingPath}' fill='none' stroke='#60a5fa' stroke-width='1.5' stroke-dasharray='3 3'/>
  <text x='8' y='14' font-family='system-ui, sans-serif' font-size='9' fill='#4ade80'>sampled</text>
  <text x='8' y='26' font-family='system-ui, sans-serif' font-size='9' fill='#f87171'>borderline</text>
  <text x='8' y='38' font-family='system-ui, sans-serif' font-size='9' fill='#60a5fa'>rolling7</text>
  <text x='${width - 8}' y='12' font-family='system-ui, sans-serif' font-size='10' fill='#fff' text-anchor='end'>${latest.summary.sampled}</text>
</svg>`;

fs.writeFileSync(OUTPUT, svg, 'utf8');
console.log(`contrast-sparkline-badge: wrote ${OUTPUT}`);
