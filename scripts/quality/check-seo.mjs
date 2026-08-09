import fs from 'node:fs';
import path from 'node:path';
import { NOINDEX_ROUTE_PREFIXES, validateMetadataQuality } from '../../src/config/seo-policy.mjs';
import { getLocalImageDimensions } from '../../src/lib/seo/image-metadata.mjs';

const DIST = path.resolve('dist');
const SITE_ORIGIN = 'https://blakeoxford.com';

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function decodeEntities(value) {
  const entities = {
    '&amp;': '&',
    '&#39;': "'",
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
  };
  return value.replace(/&amp;|&#39;|&quot;|&lt;|&gt;/g, (entity) => entities[entity]);
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match?.[1] ?? '';
}

function contentMeta(html, selector) {
  return tags(html, 'meta')
    .filter((tag) => selector(tag))
    .map((tag) => attribute(tag, 'content'));
}

function routeFor(file) {
  const relative = path.relative(DIST, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  if (!relative.endsWith('/index.html')) return null;
  return `/${relative.slice(0, -'/index.html'.length)}/`;
}

function isNoindexRoute(route) {
  return NOINDEX_ROUTE_PREFIXES.some(
    (prefix) => route === prefix.slice(0, -1) || route.startsWith(prefix)
  );
}

function fail(errors, route, message) {
  errors.push(`${route}: ${message}`);
}

if (!fs.existsSync(DIST)) {
  console.error('SEO check requires a built dist/ directory. Run pnpm build first.');
  process.exit(1);
}

const errors = [];
const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));
const pages = new Map();
const indexableMetadata = [];

for (const file of htmlFiles) {
  const route = routeFor(file);
  if (!route) continue;
  const html = fs.readFileSync(file, 'utf8');
  const isRedirect =
    /http-equiv=["']refresh["']/i.test(html) || /<title>Redirecting to:/i.test(html);
  if (isRedirect) continue;
  pages.set(route, html);

  const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((match) =>
    decodeEntities(match[1].trim())
  );
  const descriptions = contentMeta(
    html,
    (tag) => attribute(tag, 'name').toLowerCase() === 'description'
  );
  const canonicals = tags(html, 'link')
    .filter((tag) => attribute(tag, 'rel').toLowerCase() === 'canonical')
    .map((tag) => attribute(tag, 'href'));
  const robots = contentMeta(html, (tag) => attribute(tag, 'name').toLowerCase() === 'robots');
  const expectedNoindex = isNoindexRoute(route);

  if (titleMatches.length !== 1)
    fail(errors, route, `expected one title, found ${titleMatches.length}`);
  if (descriptions.length !== 1)
    fail(errors, route, `expected one meta description, found ${descriptions.length}`);
  if (canonicals.length !== 1)
    fail(errors, route, `expected one canonical, found ${canonicals.length}`);
  if (robots.length !== 1)
    fail(errors, route, `expected one robots directive, found ${robots.length}`);

  if (!expectedNoindex) {
    for (const message of validateMetadataQuality({
      title: titleMatches[0],
      description: descriptions[0],
    })) {
      fail(errors, route, message);
    }
  }
  if (canonicals[0] && canonicals[0] !== `${SITE_ORIGIN}${route}`)
    fail(errors, route, `canonical is ${canonicals[0]}`);
  if (robots[0] && robots[0].includes('noindex') !== expectedNoindex)
    fail(errors, route, `robots policy is ${robots[0]}`);

  if (!expectedNoindex) {
    const h1Count = (html.match(/<h1\b/gi) ?? []).length;
    if (h1Count !== 1) fail(errors, route, `expected one h1, found ${h1Count}`);
    indexableMetadata.push({
      route,
      title: titleMatches[0] ?? '',
      description: descriptions[0] ?? '',
    });
  }

  for (const [label, values] of [
    [
      'og:title',
      contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:title'),
    ],
    [
      'og:description',
      contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:description'),
    ],
    [
      'og:image',
      contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:image'),
    ],
    ['og:url', contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:url')],
    ['og:type', contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:type')],
    [
      'twitter:card',
      contentMeta(html, (tag) => attribute(tag, 'name').toLowerCase() === 'twitter:card'),
    ],
    [
      'og:image:width',
      contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:image:width'),
    ],
    [
      'og:image:height',
      contentMeta(html, (tag) => attribute(tag, 'property').toLowerCase() === 'og:image:height'),
    ],
  ]) {
    if (!expectedNoindex && (values.length !== 1 || !values[0]))
      fail(errors, route, `expected one populated ${label}`);
  }

  if (!expectedNoindex) {
    const ogImage = contentMeta(
      html,
      (tag) => attribute(tag, 'property').toLowerCase() === 'og:image'
    )[0];
    const imageDimensions = await getLocalImageDimensions(ogImage);
    const declaredWidth = contentMeta(
      html,
      (tag) => attribute(tag, 'property').toLowerCase() === 'og:image:width'
    )[0];
    const declaredHeight = contentMeta(
      html,
      (tag) => attribute(tag, 'property').toLowerCase() === 'og:image:height'
    )[0];

    if (!imageDimensions) {
      fail(errors, route, `social image asset could not be measured: ${ogImage || '<none>'}`);
    } else {
      if (declaredWidth !== String(imageDimensions.width))
        fail(
          errors,
          route,
          `og:image:width does not match asset (${declaredWidth} vs ${imageDimensions.width})`
        );
      if (declaredHeight !== String(imageDimensions.height))
        fail(
          errors,
          route,
          `og:image:height does not match asset (${declaredHeight} vs ${imageDimensions.height})`
        );
    }
  }

  const graphMatches = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  if (!expectedNoindex) {
    const graphEntries = [];
    for (const match of graphMatches) {
      try {
        const graph = JSON.parse(match[1]);
        if (graph['@context'] !== 'https://schema.org')
          fail(errors, route, 'JSON-LD is missing the schema.org context');
        const entries = Array.isArray(graph['@graph']) ? graph['@graph'] : [graph];
        for (const entry of entries) {
          if (!entry || typeof entry !== 'object' || typeof entry['@type'] !== 'string') {
            fail(errors, route, 'JSON-LD graph entry is missing @type');
            continue;
          }
          graphEntries.push(entry);
        }
      } catch {
        fail(errors, route, 'invalid JSON-LD');
      }
    }
    if (graphMatches.length === 0) fail(errors, route, 'missing JSON-LD');
    const types = graphEntries.map((entry) => entry['@type']);
    const routeUrl = `${SITE_ORIGIN}${route}`;
    const normalizedUrl = (value) =>
      typeof value === 'string' ? value.replace(/\/$/, '') || '/' : '';
    const requireString = (entry, field, type) => {
      if (typeof entry[field] !== 'string' || entry[field].trim().length === 0)
        fail(errors, route, `${type} JSON-LD is missing ${field}`);
    };

    const website = graphEntries.find((entry) => entry['@type'] === 'WebSite');
    if (!website) {
      fail(errors, route, 'missing WebSite JSON-LD');
    } else {
      requireString(website, 'url', 'WebSite');
      requireString(website, 'name', 'WebSite');
      requireString(website, 'description', 'WebSite');
      if (normalizedUrl(website.url) !== normalizedUrl(SITE_ORIGIN))
        fail(errors, route, `WebSite URL is ${website.url || '<none>'}`);
    }

    for (const person of graphEntries.filter((entry) => entry['@type'] === 'Person')) {
      requireString(person, 'name', 'Person');
      requireString(person, 'url', 'Person');
      if (!Array.isArray(person.sameAs) || person.sameAs.length === 0)
        fail(errors, route, 'Person JSON-LD is missing sameAs URLs');
    }

    const article = graphEntries.find((entry) => entry['@type'] === 'Article');
    if (article) {
      requireString(article, 'headline', 'Article');
      requireString(article, 'datePublished', 'Article');
      requireString(article, 'url', 'Article');
      if (normalizedUrl(article.url) !== normalizedUrl(routeUrl))
        fail(errors, route, `Article URL is ${article.url || '<none>'}`);
      if (article.author?.['@type'] !== 'Person' || typeof article.author.name !== 'string')
        fail(errors, route, 'Article JSON-LD is missing a Person author');
      if (article.mainEntityOfPage?.['@id'] !== routeUrl)
        fail(errors, route, 'Article mainEntityOfPage does not match the canonical URL');
    }

    const project = graphEntries.find((entry) => entry['@type'] === 'CreativeWork');
    if (project) {
      requireString(project, 'name', 'CreativeWork');
      requireString(project, 'dateCreated', 'CreativeWork');
      requireString(project, 'url', 'CreativeWork');
      if (normalizedUrl(project.url) !== normalizedUrl(routeUrl))
        fail(errors, route, `CreativeWork URL is ${project.url || '<none>'}`);
      if (project.creator?.['@type'] !== 'Person' || typeof project.creator.name !== 'string')
        fail(errors, route, 'CreativeWork JSON-LD is missing a Person creator');
    }

    const breadcrumbs = graphEntries.find((entry) => entry['@type'] === 'BreadcrumbList');
    if (breadcrumbs) {
      const items = breadcrumbs.itemListElement;
      if (!Array.isArray(items) || items.length < 2)
        fail(errors, route, 'BreadcrumbList JSON-LD has too few items');
      else if (items.at(-1)?.item !== routeUrl)
        fail(errors, route, 'BreadcrumbList last item does not match the canonical URL');
    }

    if (route.startsWith('/blog/') && route !== '/blog/' && !types.includes('Article'))
      fail(errors, route, 'missing Article JSON-LD');
    if (route.startsWith('/projects/') && route !== '/projects/' && !types.includes('CreativeWork'))
      fail(errors, route, 'missing CreativeWork JSON-LD');
    if (
      (route.startsWith('/blog/') && route !== '/blog/') ||
      (route.startsWith('/projects/') && route !== '/projects/')
    ) {
      if (!types.includes('BreadcrumbList')) fail(errors, route, 'missing BreadcrumbList JSON-LD');
    }
  }
}

for (const field of ['title', 'description']) {
  const seen = new Map();
  for (const entry of indexableMetadata) {
    if (!entry[field]) continue;
    const routes = seen.get(entry[field]) ?? [];
    routes.push(entry.route);
    seen.set(entry[field], routes);
  }
  for (const [_value, routes] of seen) {
    if (routes.length > 1)
      fail(errors, 'metadata', `duplicate ${field} across ${routes.join(', ')}`);
  }
}

const defaultSocialImage = path.resolve('public/assets/images/og-image.jpg');
if (fs.existsSync(defaultSocialImage)) {
  const imageBytes = fs.readFileSync(defaultSocialImage);
  let width = 0;
  let height = 0;
  let offset = 2;
  while (offset + 9 < imageBytes.length) {
    if (imageBytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = imageBytes[offset + 1];
    const segmentLength = imageBytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      height = imageBytes.readUInt16BE(offset + 5);
      width = imageBytes.readUInt16BE(offset + 7);
      break;
    }
    offset += 2 + segmentLength;
  }
  if (width !== 1200 || height !== 630) {
    fail(errors, 'social-image', `default OG image is ${width}x${height}, expected 1200x630`);
  }
} else {
  fail(errors, 'social-image', 'default OG image is missing');
}

const sitemapFiles = walk(DIST).filter((file) =>
  /sitemap(?:-index|-\d+)?\.xml$/i.test(path.basename(file))
);
if (sitemapFiles.length !== 1 || path.basename(sitemapFiles[0] ?? '') !== 'sitemap.xml') {
  fail(
    errors,
    'sitemap',
    `expected exactly one dist/sitemap.xml, found ${sitemapFiles.map((file) => path.relative(DIST, file)).join(', ') || 'none'}`
  );
}

const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml'))
  ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8')
  : '';
if (/<(?:changefreq|priority)>/i.test(sitemap)) {
  fail(errors, 'sitemap', 'unsupported changefreq/priority maintenance signals are present');
}
const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => new URL(match[1]).pathname
);
const sitemapEntries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)];
for (const entry of sitemapEntries) {
  const block = entry[1];
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const route = loc ? new URL(loc).pathname : 'sitemap';
  const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (!lastmod) continue;

  const timestamp = Date.parse(lastmod);
  if (!Number.isFinite(timestamp)) fail(errors, route, `invalid sitemap lastmod ${lastmod}`);
  if (timestamp > Date.now() + 86_400_000)
    fail(errors, route, `sitemap lastmod is in the future: ${lastmod}`);
  if (!route.startsWith('/blog/') && !route.startsWith('/projects/'))
    fail(errors, route, 'static route has an unsupported lastmod value');
}
for (const route of sitemapRoutes) {
  if (!pages.has(route)) fail(errors, route, 'sitemap URL has no built HTML page');
  if (isNoindexRoute(route)) fail(errors, route, 'noindex route appears in sitemap');
}
for (const route of pages.keys()) {
  if (!isNoindexRoute(route) && !sitemapRoutes.includes(route))
    fail(errors, route, 'indexable built page is missing from sitemap');
}

if (errors.length > 0) {
  console.error(`SEO contract failed with ${errors.length} error(s):`);
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(
  `SEO contract passed for ${pages.size} built page(s) and ${sitemapRoutes.length} sitemap URL(s).`
);
