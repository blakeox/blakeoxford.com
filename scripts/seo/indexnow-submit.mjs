import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITE_URL = 'https://blakeoxford.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

function usage(message) {
  if (message) console.error(`Error: ${message}`);
  console.error('Usage: pnpm indexnow:submit -- --url <url> [--url <url> ...]');
  console.error('   or: pnpm indexnow:submit -- --sitemap <https://blakeoxford.com/sitemap.xml>');
  process.exitCode = 1;
}

function parseArgs(argv) {
  const urls = [];
  let sitemap;

  const normalizedArgs = argv.filter((argument) => argument !== '--');
  for (let index = 0; index < normalizedArgs.length; index += 1) {
    const argument = normalizedArgs[index];
    if (argument === '--url') {
      const value = normalizedArgs[index + 1];
      if (!value) return usage('--url requires a value');
      urls.push(value);
      index += 1;
    } else if (argument === '--sitemap') {
      sitemap = normalizedArgs[index + 1];
      if (!sitemap) return usage('--sitemap requires a value');
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      console.error(
        'Submit changed URLs to IndexNow. Use --url for explicit submissions or --sitemap for an intentional bulk submission.'
      );
      return null;
    } else {
      return usage(`unknown argument ${argument}`);
    }
  }

  if (sitemap && urls.length > 0) return usage('choose --url or --sitemap, not both');
  if (!sitemap && urls.length === 0) return usage('provide at least one --url or --sitemap');
  return { sitemap, urls };
}

async function readKey() {
  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && /^[a-f0-9]{32}\.txt$/i.test(entry.name))
    .map((entry) => entry.name);

  if (candidates.length !== 1) {
    throw new Error(
      `expected exactly one 32-character IndexNow key file in ${PUBLIC_DIR}, found ${candidates.length}`
    );
  }

  const filename = candidates[0];
  const key = path.basename(filename, '.txt');
  const contents = (await fs.readFile(path.join(PUBLIC_DIR, filename), 'utf8')).trim();
  if (contents !== key)
    throw new Error(`IndexNow key file ${filename} must contain its filename key`);

  return { key, keyLocation: `${SITE_URL}/${filename}` };
}

function validateUrls(urls) {
  const unique = [...new Set(urls)];
  for (const value of unique) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== new URL(SITE_URL).hostname) {
      throw new Error(`URL must be an HTTPS URL on ${new URL(SITE_URL).hostname}: ${value}`);
    }
  }
  return unique;
}

async function urlsFromSitemap(sitemapUrl) {
  const response = await fetch(sitemapUrl);
  if (!response.ok) throw new Error(`sitemap fetch failed with HTTP ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  if (urls.length === 0) throw new Error('sitemap did not contain any <loc> entries');
  return urls;
}

const args = parseArgs(process.argv.slice(2));
if (!args) process.exit(0);

try {
  const { key, keyLocation } = await readKey();
  const submittedUrls = validateUrls(
    args.sitemap ? await urlsFromSitemap(args.sitemap) : args.urls
  );
  const payload = {
    host: new URL(SITE_URL).hostname,
    key,
    keyLocation,
    urlList: submittedUrls,
  };

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (![200, 202].includes(response.status)) {
    throw new Error(
      `IndexNow submission failed with HTTP ${response.status}: ${await response.text()}`
    );
  }

  console.log(`IndexNow accepted ${submittedUrls.length} URL(s) for ${payload.host}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
