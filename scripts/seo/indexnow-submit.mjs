import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITE_URL = 'https://blakeoxford.com';
const SITE_HOST = new URL(SITE_URL).hostname;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_FILE_PATTERN = /^[A-Za-z0-9-]{8,128}\.txt$/;
const MAX_URLS_PER_REQUEST = 10_000;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15_000;

function usage(message) {
  if (message) console.error(`Error: ${message}`);
  console.error('Usage: pnpm indexnow:submit -- --url <url> [--url <url> ...]');
  console.error('   or: pnpm indexnow:submit -- --sitemap <https://blakeoxford.com/sitemap.xml>');
  console.error('   add --dry-run to validate without submitting');
  return null;
}

function parseArgs(argv) {
  const urls = [];
  let sitemap;
  let dryRun = false;
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
    } else if (argument === '--dry-run') {
      dryRun = true;
    } else if (argument === '--help' || argument === '-h') {
      console.error(
        'Submit added, updated, or deleted URLs to IndexNow. Use --url for explicit submissions or --sitemap for an intentional bulk submission.'
      );
      return { help: true };
    } else {
      return usage(`unknown argument ${argument}`);
    }
  }

  if (sitemap && urls.length > 0) return usage('choose --url or --sitemap, not both');
  if (!sitemap && urls.length === 0) return usage('provide at least one --url or --sitemap');
  return { dryRun, sitemap, urls };
}

export async function readKey() {
  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && KEY_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name);

  if (candidates.length !== 1) {
    throw new Error(
      `expected exactly one IndexNow key file in ${PUBLIC_DIR}, found ${candidates.length}`
    );
  }

  const filename = candidates[0];
  const key = path.basename(filename, '.txt');
  const contents = (await fs.readFile(path.join(PUBLIC_DIR, filename), 'utf8')).trim();
  if (contents !== key) {
    throw new Error(`IndexNow key file ${filename} must contain its filename key`);
  }

  return { key, filename, keyLocation: `${SITE_URL}/${filename}` };
}

export function validateUrl(value, label = 'URL') {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL: ${value}`);
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname !== SITE_HOST ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error(
      `${label} must be an HTTPS URL on ${SITE_HOST} without credentials or fragments`
    );
  }
  return url.toString();
}

export function validateUrls(urls) {
  return [...new Set(urls.map((value) => validateUrl(value)))];
}

function decodeXmlEntities(value) {
  const ampersand = String.fromCharCode(38);
  return value
    .replaceAll(`${ampersand}lt;`, '<')
    .replaceAll(`${ampersand}gt;`, '>')
    .replaceAll(`${ampersand}quot;`, '"')
    .replaceAll(`${ampersand}apos;`, "'")
    .replaceAll(`${ampersand}amp;`, ampersand);
}

async function urlsFromSitemap(sitemapValue) {
  const sitemapUrl = validateUrl(sitemapValue, 'sitemap URL');
  const response = await fetch(sitemapUrl, {
    headers: { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' },
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`sitemap fetch failed with HTTP ${response.status}`);

  const xml = await response.text();
  if (xml.length > 5_000_000) throw new Error('sitemap exceeds the 5 MB safety limit');
  if (/<(?:[\w-]+:)?sitemapindex\b/i.test(xml)) {
    throw new Error('sitemap index input is not supported; provide a URL-set sitemap shard');
  }
  if (!/<(?:[\w-]+:)?urlset\b/i.test(xml)) {
    throw new Error('sitemap does not contain a <urlset> document');
  }

  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXmlEntities(match[1].trim())
  );
  if (urls.length === 0) throw new Error('sitemap did not contain any <loc> entries');
  return urls;
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function retryDelayMs(response, attempt) {
  const retryAfter = response?.headers.get('retry-after');
  if (retryAfter && /^\d+$/.test(retryAfter)) {
    return Math.min(Number(retryAfter) * 1_000, 30_000);
  }
  return Math.min(1_000 * 2 ** attempt, 30_000);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function submitBatch(payload) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let response;
    try {
      response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `IndexNow submission failed after ${MAX_RETRIES + 1} attempts: ${error instanceof Error ? error.message : error}`,
          { cause: error }
        );
      }
      await sleep(Math.min(1_000 * 2 ** attempt, 30_000));
      continue;
    }

    if ([200, 202].includes(response.status)) return response.status;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === MAX_RETRIES) {
      throw new Error(`IndexNow submission failed with HTTP ${response.status}`);
    }
    await sleep(retryDelayMs(response, attempt));
  }
  throw new Error('IndexNow submission failed unexpectedly');
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args) return 1;
  if (args.help) return 0;

  try {
    const { key, keyLocation } = await readKey();
    const submittedUrls = validateUrls(
      args.sitemap ? await urlsFromSitemap(args.sitemap) : args.urls
    );
    const batches = chunks(submittedUrls, MAX_URLS_PER_REQUEST);

    if (args.dryRun) {
      console.log(
        `IndexNow dry run passed for ${submittedUrls.length} URL(s) in ${batches.length} batch(es) for ${SITE_HOST}.`
      );
      return 0;
    }

    for (const batch of batches) {
      await submitBatch({
        host: SITE_HOST,
        key,
        keyLocation,
        urlList: batch,
      });
    }

    console.log(
      `IndexNow accepted ${submittedUrls.length} URL(s) in ${batches.length} batch(es) for ${SITE_HOST}.`
    );
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
