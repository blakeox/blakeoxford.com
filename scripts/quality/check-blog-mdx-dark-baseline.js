#!/usr/bin/env node
/**
 * Prevents blog MDX dark: utility count from increasing (grandfathered baseline).
 *
 * Usage:
 *   node scripts/quality/check-blog-mdx-dark-baseline.js
 *   node scripts/quality/check-blog-mdx-dark-baseline.js --update
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const blogDir = path.join(root, 'src/content/blog');
const baselinePath = path.join(root, 'scripts/quality/baselines/blog-mdx-dark-baseline.json');
const DARK_UTILITY_REGEX = /\bdark:[a-z][\w[\]/.%-]*/g;

function countDarkInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.match(DARK_UTILITY_REGEX)?.length ?? 0;
}

function scanBlog() {
  const counts = {};
  let total = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.mdx')) {
        const count = countDarkInFile(file);
        if (count > 0) {
          const rel = path.relative(root, file).replaceAll(path.sep, '/');
          counts[rel] = count;
          total += count;
        }
      }
    }
  }
  walk(blogDir);
  return { total, files: counts };
}

const update = process.argv.includes('--update');
const current = scanBlog();

if (update || !fs.existsSync(baselinePath)) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify({ total: current.total, files: current.files }, null, 2)}\n`
  );
  console.log(`[blog-mdx-dark-baseline] Updated baseline: total=${current.total}`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const errors = [];

if (current.total > baseline.total) {
  errors.push(`Total dark: utilities ${current.total} exceeds baseline ${baseline.total}`);
}

for (const [file, count] of Object.entries(current.files)) {
  const allowed = baseline.files?.[file];
  if (allowed === undefined) {
    errors.push(`New file with dark: utilities: ${file} (${count})`);
  } else if (count > allowed) {
    errors.push(`${file}: ${count} dark: utilities (baseline ${allowed})`);
  }
}

for (const file of Object.keys(baseline.files ?? {})) {
  if (!(file in current.files)) {
    console.log(
      `[blog-mdx-dark-baseline] ${file} no longer has dark: utilities (baseline can be ratcheted)`
    );
  }
}

if (errors.length) {
  console.error('[blog-mdx-dark-baseline] FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  console.error('\nRun: pnpm quality blog-mdx-dark');
  console.error(
    'Then: node scripts/quality/check-blog-mdx-dark-baseline.js --update (if intentional)'
  );
  process.exit(1);
}

console.log(`[blog-mdx-dark-baseline] OK total=${current.total} (baseline ${baseline.total})`);
