#!/usr/bin/env node

/**
 * Validate the rendered HTML contract for every URL in the authoritative sitemap.
 * This is intentionally read-only and independent of authenticated search tools.
 */

const BASE_URL = process.env.EDGE_BASE_URL ?? 'https://blakeoxford.com';
const REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.EDGE_TIMEOUT_SECONDS ?? 20) * 1000);
const CONCURRENCY = 4;
const USER_AGENT =
  process.env.EDGE_USER_AGENT ?? 'blakeoxford-seo-monitor/1.0 (+https://blakeoxford.com/)';

function openingTags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ?? '';
}

function findMeta(html, name, value) {
  return openingTags(html, 'meta').find(
    (tag) => attribute(tag, name).toLowerCase() === value.toLowerCase()
  );
}

function textBetween(html, open, close) {
  return html.split(open)[1]?.split(close)[0]?.trim() ?? '';
}

async function fetchWithTimeout(url) {
  const controller = new globalThis.AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function parseJsonLd(html) {
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  return scripts.map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  });
}

async function inspectRoute(url) {
  const problems = [];
  let response;
  let html;

  try {
    response = await fetchWithTimeout(url);
    html = await response.text();
  } catch (error) {
    problems.push(`request failed: ${error instanceof Error ? error.message : String(error)}`);
    return { url, problems };
  }

  if (response.status !== 200) problems.push(`HTTP ${response.status}`);
  if (response.headers.get('content-type')?.toLowerCase().includes('text/html') !== true) {
    problems.push(`content-type=${response.headers.get('content-type') ?? '<missing>'}`);
  }

  const canonicalTag = openingTags(html, 'link').find(
    (tag) => attribute(tag, 'rel').toLowerCase() === 'canonical'
  );
  const canonical = attribute(canonicalTag ?? '', 'href');
  if (canonical !== url) problems.push(`canonical=${canonical || '<missing>'}`);

  const titles = [...html.matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)];
  const title = textBetween(html, '<title>', '</title>');
  if (titles.length !== 1 || !title) problems.push(`title count/content=${titles.length}`);

  const descriptions = openingTags(html, 'meta').filter(
    (tag) => attribute(tag, 'name').toLowerCase() === 'description'
  );
  const description = attribute(descriptions[0] ?? '', 'content').trim();
  if (descriptions.length !== 1 || !description) {
    problems.push(`description count/content=${descriptions.length}`);
  }

  const robots = attribute(findMeta(html, 'name', 'robots') ?? '', 'content').toLowerCase();
  if (!robots.includes('index') || robots.includes('noindex')) {
    problems.push(`robots=${robots || '<missing>'}`);
  }

  const ogType = attribute(findMeta(html, 'property', 'og:type') ?? '', 'content');
  const ogUrl = attribute(findMeta(html, 'property', 'og:url') ?? '', 'content');
  if (!ogType) problems.push('og:type missing');
  if (ogUrl !== url) problems.push(`og:url=${ogUrl || '<missing>'}`);

  const jsonLd = parseJsonLd(html);
  if (
    jsonLd.length === 0 ||
    jsonLd.some(
      (entry) =>
        !entry ||
        (entry['@context'] !== 'https://schema.org' && entry['@context'] !== 'https://schema.org/')
    )
  ) {
    problems.push('invalid schema.org JSON-LD');
  }

  const h1Count = (html.match(/<h1\b[^>]*>/gi) ?? []).length;
  if (h1Count !== 1) problems.push(`h1 count=${h1Count}`);

  const queryUrl = new URL(url);
  queryUrl.searchParams.set('seo_audit', 'query-policy');
  try {
    const queryResponse = await fetchWithTimeout(queryUrl);
    const queryContentType = queryResponse.headers.get('content-type')?.toLowerCase() ?? '';
    const queryRobots = queryResponse.headers.get('x-robots-tag')?.toLowerCase() ?? '';
    if (queryResponse.status !== 200) problems.push(`query HTTP ${queryResponse.status}`);
    if (!queryContentType.includes('text/html')) {
      problems.push(`query content-type=${queryContentType || '<missing>'}`);
    }
    if (queryRobots !== 'noindex, nofollow') {
      problems.push(`query x-robots-tag=${queryRobots || '<missing>'}`);
    }
  } catch (error) {
    problems.push(
      `query request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return { url, problems };
}

async function inspectRoutes(routes) {
  const results = [];
  let next = 0;

  async function worker() {
    while (next < routes.length) {
      const index = next;
      next += 1;
      results[index] = await inspectRoute(routes[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, routes.length) }, worker));
  return results;
}

async function main() {
  let sitemapResponse;
  let sitemap;
  try {
    sitemapResponse = await fetchWithTimeout(`${BASE_URL}/sitemap.xml`);
    sitemap = await sitemapResponse.text();
  } catch (error) {
    console.error(`FAIL route parity: sitemap request failed: ${error}`);
    process.exitCode = 1;
    return;
  }

  if (sitemapResponse.status !== 200) {
    console.error(`FAIL route parity: sitemap returned HTTP ${sitemapResponse.status}`);
    process.exitCode = 1;
    return;
  }

  const routes = sitemapUrls(sitemap);
  const uniqueRoutes = [...new Set(routes)];
  if (routes.length === 0 || routes.length !== uniqueRoutes.length) {
    console.error(
      `FAIL route parity: sitemap route count=${routes.length}, unique=${uniqueRoutes.length}`
    );
    process.exitCode = 1;
    return;
  }

  const invalidHosts = uniqueRoutes.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.origin !== BASE_URL;
    } catch {
      return true;
    }
  });
  if (invalidHosts.length > 0) {
    console.error(
      `FAIL route parity: sitemap contains non-canonical hosts: ${invalidHosts.join(', ')}`
    );
    process.exitCode = 1;
    return;
  }

  const results = await inspectRoutes(uniqueRoutes);
  const failures = results.filter((result) => result.problems.length > 0);
  if (failures.length > 0) {
    console.error(`FAIL route parity: ${failures.length}/${results.length} route(s)`);
    for (const failure of failures) {
      console.error(`- ${failure.url}: ${failure.problems.join('; ')}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`PASS route parity: ${results.length} sitemap URL(s) passed live HTML checks`);
}

await main();
