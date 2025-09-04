#!/usr/bin/env node
/**
 * Scans Tailwind color tokens & reports low-contrast pairs against a default background.
 * Non-blocking diagnostic script.
 */
import fs from 'fs';
import path from 'path';

const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
if (!fs.existsSync(tailwindConfigPath)) {
  console.error('tailwind.config.js not found');
  process.exit(0);
}
// Dynamic import (ESM)
const cfg = await import(tailwindConfigPath + '?cachebust=' + Date.now());
const colors = (cfg.default || cfg).theme?.extend?.colors || {};

function luminance(r,g,b){ const a=[r,g,b].map(v=>{v/=255;return v<=0.03928? v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]; }
function contrast(rgb1,rgb2){const L1=luminance(rgb1[0],rgb1[1],rgb1[2]);const L2=luminance(rgb2[0],rgb2[1],rgb2[2]);const light=Math.max(L1,L2);const dark=Math.min(L1,L2);return (light+0.05)/(dark+0.05);} 
function hexToRgb(hex){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');const num=parseInt(hex,16);return [ (num>>16)&255, (num>>8)&255, num&255];}

const BG = [255,255,255]; // assume light theme white
const fails = [];

for (const [name, val] of Object.entries(colors)) {
  if (typeof val === 'string' && val.startsWith('#')) {
    const fg = hexToRgb(val);
    const ratio = contrast(fg, BG);
    if (ratio < 4.5) fails.push({ name, value: val, ratio: +ratio.toFixed(2) });
  } else if (typeof val === 'object') {
    for (const [shade, hex] of Object.entries(val)) {
      if (typeof hex === 'string' && hex.startsWith('#')) {
        const fg = hexToRgb(hex);
        const ratio = contrast(fg, BG);
        if (ratio < 4.5) fails.push({ name: `${name}-${shade}`, value: hex, ratio: +ratio.toFixed(2) });
      }
    }
  }
}

if (!fails.length) {
  console.log('✅ All extended Tailwind color tokens meet 4.5:1 contrast against white (light theme assumption).');
  process.exit(0);
}

console.log('⚠️ Low contrast tokens (light theme baseline):');
for (const f of fails) console.log(` - ${f.name} (${f.value}) ratio=${f.ratio}`);
console.log('\nScanning build output for usage...');

// Build usage scan
const distDir = path.join(process.cwd(), 'dist');
let used = [];
if (fs.existsSync(distDir)) {
  const files = [];
  const walk = d => {
    for (const entry of fs.readdirSync(d)) {
      const p = path.join(d, entry);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p); else if (/\.(html|css|js)$/.test(p)) files.push(p);
    }
  };
  walk(distDir);
  for (const token of fails) {
    const needle = token.value.toLowerCase();
    if (files.some(f => fs.readFileSync(f, 'utf-8').toLowerCase().includes(needle))) {
      used.push(token);
    }
  }
}

if (!used.length) {
  console.log('✅ No failing contrast tokens detected in built output (usage not found).');
  console.log('\nSuggestion: adjust these tokens or ensure they are only used at sufficiently large text sizes / dark backgrounds.');
  process.exit(0);
}

console.log(`❌ ${used.length} low-contrast token(s) found in built output:`);
for (const u of used) console.log(` * ${u.name} (${u.value}) ratio=${u.ratio}`);
console.log('\nFailing because low-contrast tokens are actively used.');
process.exit(1);
