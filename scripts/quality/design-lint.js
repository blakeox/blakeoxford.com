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
if (!hexFindings.length && !spacingFindings.length){
  console.log('[design-lint] No issues found.');
}
process.exit(exitCode);
