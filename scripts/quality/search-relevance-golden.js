#!/usr/bin/env node
/**
 * Search Relevance Golden Tests
 * Mirrors production localSearch ranking (title/description/tags term match)
 * against golden queries with top-N acceptance.
 */
import fs from 'fs';
import path from 'path';
import { normalizeSlug } from '../../src/utils/slug.ts';

const root = process.cwd();
const goldenPath = path.join(root, 'tests/search/golden-queries.json');
const blogIndexPath = path.join(root, 'public/search/blog.json');
const projectsIndexPath = path.join(root, 'public/search/projects.json');
const TOP_N = parseInt(process.env.SEARCH_TOP_N || '3', 10);

function load(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

/** Same ranking as src/lib/search/localSearch.ts (keep in sync). */
function searchLocalCorpus(corpus, query, limit = 10) {
  const normalized = String(query || '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return corpus
      .slice()
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .slice(0, limit);
  }
  const terms = normalized.split(/\s+/).filter(Boolean);
  return corpus
    .map((record) => {
      const haystack =
        `${record.title} ${record.description} ${record.tags.join(' ')}`.toLowerCase();
      const matchedTerms = terms.filter((term) => haystack.includes(term)).length;
      const score = matchedTerms / terms.length;
      return { record, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record, score }) => ({ ...record, score }));
}

function main() {
  if (!fs.existsSync(goldenPath)) {
    console.error('[search:relevance] Golden file missing.');
    process.exitCode = 1;
    return;
  }
  const golden = load(goldenPath);
  const blog = fs.existsSync(blogIndexPath) ? load(blogIndexPath) : [];
  const projects = fs.existsSync(projectsIndexPath) ? load(projectsIndexPath) : [];
  const corpus = [...blog, ...projects].map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description ?? '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
  }));
  const availableSlugs = new Set(corpus.map((i) => normalizeSlug(i.slug)));

  let strictPass = 0;
  let topNPass = 0;
  const results = golden.map((g) => {
    const expectedNorm = normalizeSlug(g.expectedTopSlug);
    const expectedExists = availableSlugs.has(expectedNorm);
    const hits = searchLocalCorpus(corpus, g.query, TOP_N);
    const topSlug = hits[0]?.slug ? normalizeSlug(hits[0].slug) : null;
    const inTopN = hits.some((h) => normalizeSlug(h.slug) === expectedNorm);
    const strict = topSlug === expectedNorm;
    if (strict) strictPass++;
    else if (inTopN) topNPass++;
    return {
      query: g.query,
      expected: g.expectedTopSlug,
      expectedExists,
      actualTop: topSlug,
      inTopN,
      strict,
      hits: hits.map((h) => ({ slug: normalizeSlug(h.slug), score: h.score })),
    };
  });
  const total = golden.length;
  const summary = {
    total,
    strictPass,
    topNPass,
    strictPassRate: +((strictPass / total) * 100).toFixed(1),
    topNPassRate: +(((strictPass + topNPass) / total) * 100).toFixed(1),
    topN: TOP_N,
    results,
  };
  const minTopN = parseFloat(process.env.MIN_TOPN_PASS_RATE || '0');
  summary.minTopNRequired = minTopN;
  summary.gatePassed = summary.topNPassRate >= minTopN;
  fs.writeFileSync('search-relevance-results.json', JSON.stringify(summary, null, 2));
  console.log('# Search Relevance');
  console.log(`- Strict Pass: ${summary.strictPassRate}% (${strictPass}/${total})`);
  console.log(`- Top-${TOP_N} Pass: ${summary.topNPassRate}% (${strictPass + topNPass}/${total})`);
  if (minTopN > 0)
    console.log(
      `- Gate: require >= ${minTopN}% top-${TOP_N} => ${summary.gatePassed ? 'PASSED' : 'FAILED'}`
    );
  results
    .slice(0, 10)
    .forEach((r) =>
      console.log(
        `  - ${r.query}: ${r.strict ? '✅ strict' : r.inTopN ? '🟡 topN' : '❌'} expected=${r.expected} top=${r.actualTop}` +
          (r.expectedExists ? '' : ' (missing)')
      )
    );
  if (!summary.gatePassed) process.exitCode = 1;
}

main();
