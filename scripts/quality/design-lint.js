#!/usr/bin/env node
/**
 * Lightweight design lint: scans src/ & components for raw hex colors and irregular spacing usage.
 * Policy: discourage ad-hoc hex unless part of token definition; report suspicious spacing values.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const SRC_DIRS = ['src'];
const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;
// Ban direct Tailwind grayscale text utilities for body/headings (policy shift)
const BANNED_GRAY_REGEX = /text-gray-(?:5|6|7|8|9)00(?![A-Za-z0-9-])/g; // matches text-gray-500..900
// Mapping hints mirroring codemod strategy
const GRAY_MAPPING = {
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground/85',
  'text-gray-600': 'text-foreground/80',
  'text-gray-500': 'text-foreground/70'
};
// Allow within token/design docs or migration comments
const GRAY_ALLOW_PATH = /design-best-practices|tailwind|token|theme|migration/i;
let grayFindings = [];
// spacing: look for arbitrary pixel values not in 0,1,2,4,8 multiples (quick heuristic)
const PX_REGEX = /([^0-9]|^)([0-9]+)px/g;
const allowedPx = new Set([0,1,2,4,8,12,16,20,24,28,32,36,40,48,56,64]);

let hexFindings = [];
let spacingFindings = [];

function walk(dir){
  const entries = fs.readdirSync(dir,{withFileTypes:true});
  for(const e of entries){
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walk(p);
  else if (/\.(astro|tsx|ts|js|css|mdx?)$/.test(e.name)) analyze(p);
  }
}

function analyze(file){
  const rel = path.relative(root,file);
  const content = fs.readFileSync(file,'utf8');
  if (!/tailwind|token|palette|color/i.test(rel)) { // permit inside token files implicitly
    const hexMatches = content.match(HEX_REGEX);
    if (hexMatches){
      hexMatches.forEach(h => {
        // ignore hash in comments like #endregion (not hex) or long codes >8 chars
        if (!/^#[0-9a-fA-F]{3,8}$/.test(h)) return;
        hexFindings.push({file: rel, value: h});
      });
    }
  }
  if (!GRAY_ALLOW_PATH.test(rel)) {
    const grayMatches = content.match(BANNED_GRAY_REGEX);
    if (grayMatches) {
      grayMatches.forEach(g => {
        // tolerate inside class strings for icons or purely decorative (heuristic skip if contains 'icon')
        if (/icon-/.test(content)) return;
        grayFindings.push({file: rel, value: g});
      });
    }
  }
  let m;
  while ((m = PX_REGEX.exec(content))){
    const val = parseInt(m[2],10);
    if (!allowedPx.has(val)) spacingFindings.push({file: rel, value: val});
  }
}

SRC_DIRS.forEach(d => walk(path.join(root,d)));

let exitCode = 0;
if (hexFindings.length){
  console.log('\n[design-lint] Raw hex colors detected (prefer tokens):');
  hexFindings.slice(0,50).forEach(f => console.log(`  ${f.file} -> ${f.value}`));
  if (hexFindings.length > 50) console.log(`  ... +${hexFindings.length-50} more`);
  exitCode = 1;
}
if (spacingFindings.length){
  console.log('\n[design-lint] Suspicious pixel spacing values:');
  const grouped = spacingFindings.reduce((acc,f)=>{ acc[f.value]=(acc[f.value]||0)+1; return acc; },{});
  Object.entries(grouped).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([val,count])=>{
    console.log(`  ${val}px (${count} occurrences)`);
  });
  exitCode = 1;
}
if (grayFindings.length){
  console.log('\n[design-lint] Deprecated text-gray-* utilities detected (use semantic tokens):');
  grayFindings.slice(0,50).forEach(f => {
    const hint = GRAY_MAPPING[f.value] || 'text-foreground';
    console.log(`  ${f.file} -> ${f.value}  (suggest: ${hint})`);
  });
  if (grayFindings.length > 50) console.log(`  ... +${grayFindings.length-50} more`);
  // Summary by class for quick remediation planning
  const summary = grayFindings.reduce((acc,f)=>{ acc[f.value]=(acc[f.value]||0)+1; return acc; },{});
  console.log('\n  Summary (class -> count / replacement):');
  Object.entries(summary).sort((a,b)=>b[1]-a[1]).forEach(([cls,count])=>{
    console.log(`    ${cls}: ${count}  -> ${GRAY_MAPPING[cls] || 'text-foreground'}`);
  });
  exitCode = 1;
}
if (!hexFindings.length && !spacingFindings.length && !grayFindings.length){
  console.log('[design-lint] No issues found.');
}
process.exit(exitCode);
