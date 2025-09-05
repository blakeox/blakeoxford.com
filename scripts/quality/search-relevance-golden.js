#!/usr/bin/env node
/**
 * Search Relevance Golden Tests
 * Loads static search index (public/search/*.json) and a golden queries file.
 * For each query, runs basic Fuse.js search and checks expected top slug.
 * Outputs summary JSON and console markdown snippet.
 */
import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';

const root = process.cwd();
const goldenPath = path.join(root, 'tests/search/golden-queries.json');
const blogIndexPath = path.join(root, 'public/search/blog.json');
const projectsIndexPath = path.join(root, 'public/search/projects.json');

function load(p){ return JSON.parse(fs.readFileSync(p,'utf-8')); }

function buildFuse(data) {
  return new Fuse(data, { keys: ['title','slug','summary','tags'], threshold: 0.4, ignoreLocation: true });
}

function main(){
  if (!fs.existsSync(goldenPath)) {
    console.error('[search:relevance] Golden file missing.');
    process.exitCode = 1; return;
  }
  const golden = load(goldenPath);
  const blog = fs.existsSync(blogIndexPath) ? load(blogIndexPath) : [];
  const projects = fs.existsSync(projectsIndexPath) ? load(projectsIndexPath) : [];
  const fuseAll = buildFuse([...blog, ...projects]);
  let passed = 0;
  const results = golden.map(g => {
    const hits = fuseAll.search(g.query);
    const top = hits[0]?.item?.slug || null;
    const ok = top === g.expectedTopSlug;
    if (ok) passed++;
    return { query: g.query, expected: g.expectedTopSlug, actual: top, pass: ok };
  });
  const passRate = golden.length ? (passed / golden.length * 100).toFixed(1) : '0.0';
  const summary = { total: golden.length, passed, passRate: parseFloat(passRate), results };
  fs.writeFileSync('search-relevance-results.json', JSON.stringify(summary,null,2));
  console.log(`# Search Relevance\n- Pass Rate: ${passRate}% (${passed}/${golden.length})`);
  results.slice(0,10).forEach(r=> console.log(`  - ${r.query}: ${r.pass?'✅':'❌'} expected=${r.expected} actual=${r.actual}`));
}

main();
