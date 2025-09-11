#!/usr/bin/env node
/**
 * Fails if page.waitForTimeout(...) usage appears outside allowed utility directories.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const ALLOW_DIR_SNIPPETS = ['tests/playwright/utils', 'deterministic'];
const TARGET_PATTERN = /page\.waitForTimeout\(/g;
let violations = [];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if(entry.isDirectory()) walk(p); else if(/\.(ts|js|tsx|astro)$/.test(entry.name)) scan(p);
  }
}
function scan(file){
  const rel = path.relative(root,file);
  if (ALLOW_DIR_SNIPPETS.some(sn => rel.includes(sn))) return; // allowed context
  const content = fs.readFileSync(file,'utf8');
  if (TARGET_PATTERN.test(content)) violations.push(rel);
}

walk(path.join(root,'tests'));
walk(path.join(root,'src'));

if (violations.length){
  console.error(`❌ Raw waitForTimeout usage detected in ${violations.length} file(s):`);
  violations.forEach(f => console.error('  - ' + f));
  process.exit(1);
} else {
  console.log('✅ No raw waitForTimeout usages outside approved utilities.');
}
