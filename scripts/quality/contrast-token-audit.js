#!/usr/bin/env node
/**
 * Scans design tokens in theme.css & reports low-contrast pairs against a default background.
 * Non-blocking diagnostic script. (Legacy hex maps in a JS Tailwind config are no longer used.)
 */
import fs from 'fs';
import path from 'path';

const themeCssPath = path.join(process.cwd(), 'src/styles/theme.css');
if (!fs.existsSync(themeCssPath)) {
  console.error('src/styles/theme.css not found');
  process.exit(0);
}

const themeCss = fs.readFileSync(themeCssPath, 'utf-8');
// Extract simple hex custom properties if any remain (OKLCH is the primary format).
const hexTokenPattern = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g;
const colors = {};
for (const match of themeCss.matchAll(hexTokenPattern)) {
  colors[match[1]] = match[2];
}

function luminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(rgb1, rgb2) {
  const L1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const L2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

const LIGHT_BG = [255, 255, 255]; // light theme assumption (white)
const DARK_BG = [17, 17, 17]; // representative dark background (#111)
const lightFails = [];
const darkFails = [];

for (const [name, val] of Object.entries(colors)) {
  if (typeof val === 'string' && val.startsWith('#')) {
    const fg = hexToRgb(val);
    const lightRatio = contrast(fg, LIGHT_BG);
    const darkRatio = contrast(fg, DARK_BG);
    if (lightRatio < 4.5) lightFails.push({ name, value: val, ratio: +lightRatio.toFixed(2) });
    if (darkRatio < 4.5)
      darkFails.push({ name: name + ' (dark)', value: val, ratio: +darkRatio.toFixed(2) });
  }
}
const hasAny = lightFails.length || darkFails.length;
if (!hasAny) {
  console.log(
    '✅ All hex tokens in theme.css meet 4.5:1 contrast in both light (#fff) and dark (#111) contexts.'
  );
  process.exit(0);
}

if (lightFails.length) {
  console.log('⚠️ Low contrast tokens (light theme baseline):');
  for (const f of lightFails) console.log(` - ${f.name} (${f.value}) ratio=${f.ratio}`);
  console.log('');
} else {
  console.log('✅ No low-contrast tokens for light theme.');
}
if (darkFails.length) {
  console.log('⚠️ Low contrast tokens (dark theme baseline):');
  for (const f of darkFails) console.log(` - ${f.name} (${f.value}) ratio=${f.ratio}`);
  console.log('');
} else {
  console.log('✅ No low-contrast tokens for dark theme.');
}

console.log('Scanning build output for usage...');

// Build usage scan
const distDir = path.join(process.cwd(), 'dist');
let used = [];
if (fs.existsSync(distDir)) {
  const files = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d)) {
      const p = path.join(d, entry);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (/\.(html|css|js)$/.test(p)) files.push(p);
    }
  };
  walk(distDir);
  for (const token of [...lightFails, ...darkFails]) {
    const needle = token.value.toLowerCase();
    if (files.some((f) => fs.readFileSync(f, 'utf-8').toLowerCase().includes(needle))) {
      used.push(token);
    }
  }
}

if (!used.length) {
  console.log(
    '✅ No failing contrast tokens (light or dark) detected in built output (usage not found).'
  );
  console.log(
    '\nSuggestion: adjust these tokens or ensure contextual backgrounds provide sufficient contrast.'
  );
  process.exit(0);
}

console.log(`❌ ${used.length} low-contrast token(s) found in built output (light+dark):`);
for (const u of used) console.log(` * ${u.name} (${u.value}) ratio=${u.ratio}`);
console.log('\nFailing because low-contrast tokens are actively used in build artifacts.');
process.exit(1);
