#!/usr/bin/env node
/**
 * Deploy Cloudflare Zaraz configuration for blakeoxford.com.
 *
 * Required env:
 *   GA4_MEASUREMENT_ID   e.g. G-XXXXXXXXXX
 *
 * Clarity is loaded from the site via PUBLIC_CLARITY_PROJECT_ID (see src/lib/clarity.ts).
 *
 * Auth (one of):
 *   CLOUDFLARE_API_TOKEN — API token with Zone > Zaraz > Edit
 *   --from-wrangler      — uses `wrangler auth token` (may lack Zaraz scope)
 *
 * Usage:
 *   GA4_MEASUREMENT_ID=G-XXX CLOUDFLARE_API_TOKEN=... node scripts/setup/deploy-zaraz.mjs
 *   GA4_MEASUREMENT_ID=G-XXX node scripts/setup/deploy-zaraz.mjs --dry-run
 *   GA4_MEASUREMENT_ID=G-XXX node scripts/setup/deploy-zaraz.mjs --write-only
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const zoneId = 'f4341fe15e5325236939dd1c70dc5efd';
const zoneName = 'blakeoxford.com';
const templatePath = join(repoRoot, 'infra/zaraz/blakeoxford.com.template.json');
const outputPath = join(repoRoot, 'infra/zaraz/blakeoxford.com.json');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const writeOnly = args.has('--write-only');
const fromWrangler = args.has('--from-wrangler');

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

function resolveToken() {
  if (process.env.CLOUDFLARE_API_TOKEN?.trim()) {
    return process.env.CLOUDFLARE_API_TOKEN.trim();
  }
  if (!fromWrangler) return '';
  try {
    const raw = execFileSync('pnpm', ['exec', 'wrangler', 'auth', 'token', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(raw);
    const lines = String(parsed.token ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.at(-1) ?? '';
  } catch {
    return '';
  }
}

function buildConfig() {
  const ga4Id = requiredEnv('GA4_MEASUREMENT_ID');

  if (!/^G-[A-Z0-9]+$/i.test(ga4Id)) {
    console.warn(`Warning: GA4_MEASUREMENT_ID "${ga4Id}" does not look like G-XXXXXXXXXX`);
  }

  let template = readFileSync(templatePath, 'utf8');
  template = template.replaceAll('__GA4_MEASUREMENT_ID__', ga4Id);
  return JSON.parse(template);
}

async function deployConfig(config, token) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/zaraz/config`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    }
  );

  const body = await response.json();
  if (!response.ok || !body.success) {
    const message = body.errors?.map((err) => err.message).join('; ') || response.statusText;
    throw new Error(`Zaraz deploy failed (${response.status}): ${message}`);
  }
  return body.result;
}

async function publishConfig(token) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/zaraz/publish`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify('Publish analytics configuration'),
    }
  );

  const body = await response.json();
  if (!response.ok || !body.success) {
    const message = body.errors?.map((err) => err.message).join('; ') || response.statusText;
    throw new Error(`Zaraz publish failed (${response.status}): ${message}`);
  }
  return body.result;
}

function printManualSteps() {
  console.log('\nManual import (if API deploy is unavailable):');
  console.log('1. Open https://dash.cloudflare.com/?to=/:account/tag-management/zaraz');
  console.log(`2. Select zone: ${zoneName}`);
  console.log('3. Settings → Advanced → Import');
  console.log(`4. Choose: ${outputPath}`);
  console.log('5. Publish the configuration');
  console.log('\nGoogle Search Console is not a Zaraz tool. Verify the domain via DNS or add');
  console.log('PUBLIC_GOOGLE_SITE_VERIFICATION to .env for the HTML meta tag in BaseLayout.');
  console.log('\nCloudflare Web Analytics is managed separately from Zaraz.');
  console.log('Use the existing auto-install site configuration; do not add a second beacon.');
}

async function main() {
  const config = buildConfig();
  writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);

  if (dryRun) {
    console.log(JSON.stringify(config, null, 2));
    printManualSteps();
    return;
  }

  if (writeOnly) {
    printManualSteps();
    return;
  }

  const token = resolveToken();
  if (!token) {
    console.error(
      'No CLOUDFLARE_API_TOKEN set. Create a token with Zone > Zaraz > Edit, or pass --write-only / --dry-run.'
    );
    printManualSteps();
    process.exit(1);
  }

  try {
    await deployConfig(config, token);
    await publishConfig(token);
    console.log(`Zaraz configuration published to ${zoneName} (${zoneId}).`);
    console.log(
      'Verify in Tag Management → Monitoring, then test with ?zarazDebug=true on the site.'
    );
  } catch (error) {
    console.error(String(error));
    console.error(
      '\nYour token may lack Zaraz permissions. Re-run with --write-only and import via the dashboard.'
    );
    printManualSteps();
    process.exit(1);
  }
}

main();
