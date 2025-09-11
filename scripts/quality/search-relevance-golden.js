#!/usr/bin/env node
/**
 * Search Relevance Golden Tests
 * Weighted Fuse.js search with top-N acceptance and expected presence validation.
 */
import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';
import { normalizeSlug } from '../../src/utils/slug.js';

const root = process.cwd();
const goldenPath = path.join(root, 'tests/search/golden-queries.json');
const blogIndexPath = path.join(root, 'public/search/blog.json');
const projectsIndexPath = path.join(root, 'public/search/projects.json');
const TOP_N = parseInt(process.env.SEARCH_TOP_N || '3', 10); // Accept if expected inside top N

function load(p){ return JSON.parse(fs.readFileSync(p,'utf-8')); }

function buildFuse(data) {
  return new Fuse(data, { 
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'tags', weight: 0.2 },
      { name: 'summary', weight: 0.15 },
      { name: 'slug', weight: 0.15 }
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 3,
    includeScore: true,
    useExtendedSearch: true
  });
}

// slug normalization moved to src/utils/slug.ts for reuse & testability

function main(){
  if (!fs.existsSync(goldenPath)) {
    console.error('[search:relevance] Golden file missing.');
    process.exitCode = 1; return;
  }
  const golden = load(goldenPath);
  const blog = fs.existsSync(blogIndexPath) ? load(blogIndexPath) : [];
  const projects = fs.existsSync(projectsIndexPath) ? load(projectsIndexPath) : [];
  const corpus = [...blog, ...projects];
  const availableSlugs = new Set(corpus.map(i => normalizeSlug(i.slug)));
  const fuseAll = buildFuse(corpus);
  let strictPass = 0;
  let topNPass = 0;
  const results = golden.map(g => {
    const expectedNorm = normalizeSlug(g.expectedTopSlug);
    const expectedExists = availableSlugs.has(expectedNorm);
    const hits = fuseAll.search(g.query).slice(0, TOP_N);
    const topSlug = hits[0]?.item?.slug ? normalizeSlug(hits[0].item.slug) : null;
    const inTopN = hits.some(h => normalizeSlug(h.item.slug) === expectedNorm);
    const strict = topSlug === expectedNorm;
    if (strict) strictPass++; else if (inTopN) topNPass++;
    return { 
      query: g.query,
      expected: g.expectedTopSlug,
      expectedExists,
      actualTop: topSlug,
      inTopN,
      strict,
      hits: hits.map(h => ({ slug: normalizeSlug(h.item.slug), score: h.score }))
    };
  });
  const total = golden.length;
  const summary = { total, strictPass, topNPass, strictPassRate: +(strictPass/total*100).toFixed(1), topNPassRate: +((strictPass+topNPass)/total*100).toFixed(1), topN: TOP_N, results };
  const minTopN = parseFloat(process.env.MIN_TOPN_PASS_RATE || '0');
  summary.minTopNRequired = minTopN;
  summary.gatePassed = summary.topNPassRate >= minTopN;
  fs.writeFileSync('search-relevance-results.json', JSON.stringify(summary,null,2));
  console.log('# Search Relevance');
  console.log(`- Strict Pass: ${summary.strictPassRate}% (${strictPass}/${total})`);
  console.log(`- Top-${TOP_N} Pass: ${summary.topNPassRate}% (${strictPass+topNPass}/${total})`);
  if (minTopN > 0) console.log(`- Gate: require >= ${minTopN}% top-${TOP_N} => ${summary.gatePassed ? 'PASSED' : 'FAILED'}`);
  results.slice(0,10).forEach(r=> console.log(`  - ${r.query}: ${r.strict?'✅ strict': r.inTopN?'🟡 topN':'❌'} expected=${r.expected} top=${r.actualTop}` + (r.expectedExists?'':' (missing)')));
  if (!summary.gatePassed) process.exitCode = 1;
}

main();
