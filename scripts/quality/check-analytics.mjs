#!/usr/bin/env node
/**
 * Validate the analytics contract without contacting any vendor.
 *
 * Usage:
 *   node scripts/quality/check-analytics.mjs
 *   node scripts/quality/check-analytics.mjs --require-clarity
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const requireClarity = process.argv.includes('--require-clarity');
const sourceRoot = join(repoRoot, 'src');
const templatePath = join(repoRoot, 'infra/zaraz/blakeoxford.com.template.json');
const blockedKeys = [
  'email',
  'message_id',
  'metric_id',
  'password',
  'prompt',
  'query',
  'referrer',
  'response',
  'session_id',
  'token',
  'user_id',
];

function fail(message) {
  console.error(`Analytics validation failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(astro|html|js|jsx|mdx|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const files = sourceFiles(sourceRoot);
const source = files.map((path) => ({ path, text: readFileSync(path, 'utf8') }));

for (const { path, text } of source) {
  for (const match of text.matchAll(/trackEvent\(\s*['"]([^'"]+)['"]/g)) {
    assert(
      /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(match[1]),
      `${relative(repoRoot, path)} uses non-snake-case event "${match[1]}"`
    );
  }
}

const analyticsSource = readFileSync(join(sourceRoot, 'lib/analytics.ts'), 'utf8');
for (const key of blockedKeys) {
  const helperPayloadUsesKey = new RegExp(`\\b${key}\\s*:`, 'm').test(analyticsSource);
  const sanitizerDefinesKey = new RegExp(`['"]${key}['"]`).test(analyticsSource);
  assert(
    !helperPayloadUsesKey || sanitizerDefinesKey,
    `analytics helper emits blocked or unreviewed field "${key}"`
  );
}

const zaraz = JSON.parse(readFileSync(templatePath, 'utf8'));
assert(zaraz.settings?.hideIPAddress === true, 'Zaraz must hide IP addresses');
assert(zaraz.settings?.hideUserAgent === true, 'Zaraz must hide user agents');
assert(zaraz.settings?.hideQueryParams === true, 'Zaraz must hide query parameters');
assert(zaraz.settings?.hideExternalReferer === true, 'Zaraz must hide external referrers');
assert(
  zaraz.tools?.toolGa4?.settings?.tid === '__GA4_MEASUREMENT_ID__',
  'GA4 ID must remain templated'
);
assert(
  !JSON.stringify(zaraz).includes('G-PLACEHOLDER'),
  'Zaraz template contains a live placeholder'
);

const clarityId = process.env.PUBLIC_CLARITY_PROJECT_ID?.trim() ?? '';
if (clarityId) {
  assert(/^[a-z0-9]{6,32}$/i.test(clarityId), 'PUBLIC_CLARITY_PROJECT_ID has an invalid shape');
}
if (requireClarity) {
  assert(Boolean(clarityId), 'PUBLIC_CLARITY_PROJECT_ID is required for this build');
  const distPath = join(repoRoot, 'dist');
  const distFiles = existsSync(distPath) ? sourceFiles(distPath) : [];
  const distText = distFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(
    distText.includes(clarityId),
    'built output does not contain the configured Clarity project ID'
  );
}

console.log('Analytics contract OK');
console.log(`- source files checked: ${files.length}`);
console.log('- privacy boundary: direct identifiers and content are blocked');
console.log(`- Clarity build requirement: ${requireClarity ? 'enabled' : 'optional'}`);
