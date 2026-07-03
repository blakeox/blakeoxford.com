#!/usr/bin/env node
/**
 * Prevents new Tailwind `dark:` utilities in reusable components.
 *
 * Grandfathers the current baseline; CI fails only when counts increase
 * or a new file under src/components gains dark: utilities.
 *
 * Usage:
 *   node scripts/quality/check-dark-utilities-baseline.js
 *   node scripts/quality/check-dark-utilities-baseline.js --update
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentsDir = path.join(root, 'src/components');
const baselinePath = path.join(root, 'scripts/quality/baselines/dark-utilities-baseline.json');
const DARK_UTILITY_REGEX = /\bdark:[a-z][\w[\]/.%-]*/g;
const SOURCE_EXTENSIONS = /\.(astro|tsx?|jsx?)$/;

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function walkFiles(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(file, onFile);
    else if (SOURCE_EXTENSIONS.test(file)) onFile(file);
  }
}

function countDarkUtilities(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(DARK_UTILITY_REGEX);
  return matches?.length ?? 0;
}

function scanComponents() {
  const counts = {};
  walkFiles(componentsDir, (file) => {
    const count = countDarkUtilities(file);
    if (count > 0) counts[rel(file)] = count;
  });
  return counts;
}

const update = process.argv.includes('--update');
const current = scanComponents();

if (update) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`[dark-utilities] Baseline updated (${Object.keys(current).length} files).`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error('[dark-utilities] Missing baseline file. Run with --update to generate it.');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const failures = [];

for (const [file, count] of Object.entries(current)) {
  const allowed = baseline[file];
  if (allowed === undefined) {
    failures.push({ file, reason: `new file with ${count} dark: utilit${count === 1 ? 'y' : 'ies'}` });
    continue;
  }
  if (count > allowed) {
    failures.push({ file, reason: `count increased ${allowed} -> ${count}` });
  }
}

for (const file of Object.keys(baseline)) {
  if (!(file in current)) {
    failures.push({ file, reason: 'baseline entry removed without updating counts' });
  }
}

if (!failures.length) {
  const total = Object.values(current).reduce((sum, count) => sum + count, 0);
  console.log(`[dark-utilities] OK — ${Object.keys(current).length} files, ${total} utilities (baseline locked).`);
  process.exit(0);
}

console.error('[dark-utilities] New dark: utilities detected in src/components:');
for (const failure of failures) {
  console.error(`  ${failure.file}: ${failure.reason}`);
}
console.error('\nMigrate to semantic tokens in theme.css instead of adding dark: classes.');
console.error('If intentional, reduce counts elsewhere or run --update after team review.');
process.exit(1);
