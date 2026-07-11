#!/usr/bin/env node
/**
 * Validate Zaraz template structure (no Cloudflare API required).
 * Fails CI if the checked-in template drifts from expected world-class shape.
 *
 * Usage:
 *   node scripts/setup/validate-zaraz.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const templatePath = join(repoRoot, 'infra/zaraz/blakeoxford.com.template.json');

function fail(message) {
  console.error(`Zaraz validation failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const raw = readFileSync(templatePath, 'utf8');
let config;
try {
  config = JSON.parse(raw);
} catch (error) {
  fail(`invalid JSON (${error instanceof Error ? error.message : String(error)})`);
}

assert(config.settings?.autoInjectScript === true, 'settings.autoInjectScript must be true');
assert(config.historyChange === true, 'historyChange must be true for SPA pageviews');
assert(config.dataLayer === true, 'dataLayer compatibility must be enabled');
assert(config.settings?.hideIPAddress === true, 'hideIPAddress should be enabled');
assert(config.settings?.hideUserAgent === true, 'hideUserAgent should be enabled');
assert(config.settings?.hideQueryParams === true, 'hideQueryParams should be enabled');
assert(config.settings?.cookieDomain === 'blakeoxford.com', 'cookieDomain must be blakeoxford.com');

assert(config.triggers?.tPageview?.system === 'pageload', 'missing tPageview pageload trigger');
assert(config.triggers?.tAllEvents?.loadRules?.length > 0, 'missing tAllEvents custom-event trigger');

const ga4 = config.tools?.toolGa4;
assert(ga4?.enabled === true, 'toolGa4 must be enabled');
assert(ga4?.component === 'google-analytics-4', 'toolGa4 must be google-analytics-4');
assert(
  ga4?.settings?.tid === '__GA4_MEASUREMENT_ID__',
  'toolGa4.tid must remain the __GA4_MEASUREMENT_ID__ placeholder',
);
assert(ga4?.actions?.aGa4Pageview?.actionType === 'pageview', 'missing GA4 pageview action');
assert(ga4?.actions?.aGa4Event?.actionType === 'event', 'missing GA4 event action');
assert(
  Array.isArray(ga4?.actions?.aGa4Pageview?.firingTriggers) &&
    ga4.actions.aGa4Pageview.firingTriggers.includes('tPageview'),
  'GA4 pageview must fire on tPageview',
);
assert(
  Array.isArray(ga4?.actions?.aGa4Event?.firingTriggers) &&
    ga4.actions.aGa4Event.firingTriggers.includes('tAllEvents'),
  'GA4 event must fire on tAllEvents',
);

const linker = config.tools?.toolConversionLinker;
assert(linker?.enabled === true, 'Conversion Linker must be enabled');
assert(linker?.component === 'google-conversion-linker', 'Conversion Linker component mismatch');

console.log('Zaraz template OK:', templatePath);
