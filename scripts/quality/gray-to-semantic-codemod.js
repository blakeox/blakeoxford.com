#!/usr/bin/env node
/**
 * gray-to-semantic-codemod.js
 * Dry-run / write codemod replacing Tailwind text-gray-* utilities with semantic tokens.
 * Strategy:
 *  - text-gray-900 -> text-foreground
 *  - text-gray-800 -> text-foreground
 *  - text-gray-700 -> text-foreground/85
 *  - text-gray-600 -> text-foreground/80
 *  - text-gray-500 -> text-foreground/70
 *  - dark: variants mapped similarly.
 *  - Skip files in token/theme directories.
 *  - Provide summary + counts.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DRY = !process.argv.includes('--write');

const MAP = {
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground/85',
  'text-gray-600': 'text-foreground/80',
  'text-gray-500': 'text-foreground/70'
};

const REGEX = new RegExp(`(?:^|\\s)(dark:)?(${Object.keys(MAP).join('|')})(?=\\s|$)`, 'g');

const TARGET_EXT = /\.(astro|tsx|ts|js|mdx?)$/;
const SKIP_PATH = /(token|theme|tailwind|design-best-practices)/i;

let stats = { filesScanned: 0, filesModified: 0, replacements: 0 };

function walk(dir){
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})){
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (TARGET_EXT.test(entry.name)) processFile(full);
  }
}

function processFile(file){
  if (SKIP_PATH.test(file)) return;
  const orig = fs.readFileSync(file,'utf8');
  stats.filesScanned++;
  let modified = false;
  const out = orig.replace(REGEX, (match, darkPrefix, gray) => {
    const repl = MAP[gray];
    if (!repl) return match; // safety
    modified = true;
    stats.replacements++;
    const replacement = darkPrefix ? `${darkPrefix}${repl}` : repl;
    // Preserve leading space if present in match
    if (/^\s/.test(match)) return match.charAt(0) + replacement;
    return ' ' + replacement;
  });
  if (modified) {
    stats.filesModified++;
    if (!DRY) fs.writeFileSync(file, out, 'utf8');
    else {
      const rel = path.relative(ROOT, file);
      console.log(`[codemod][dry-run] would modify ${rel}`);
    }
  }
}

walk(path.join(ROOT,'src'));

console.log(`Codemod complete. Scanned=${stats.filesScanned} Modified=${stats.filesModified} Replacements=${stats.replacements} Mode=${DRY?'DRY':'WRITE'}`);
console.log('Run with --write to apply changes.');
