/**
 * Re-index the public site in AI Search and drop similarity-cache answers
 * so a content deploy is not served from the previous crawl.
 *
 * Uses CLOUDFLARE_API_TOKEN in CI. Locally, falls back to the Wrangler OAuth
 * token without printing it.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const INSTANCE = 'bold-heart-18e4';
const ACCOUNT_ID = 'cc3bb24ae3c87cff38c2be85df3dab29';

function readOAuthToken() {
  const candidates = [
    join(homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
    join(homedir(), '.wrangler/config/default.toml'),
    join(homedir(), '.config/.wrangler/config/default.toml'),
  ];
  for (const path of candidates) {
    try {
      const toml = readFileSync(path, 'utf8');
      const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
      if (match?.[1]) return match[1];
    } catch {
      // Try the next Wrangler config location.
    }
  }
  return undefined;
}

function apiToken() {
  return process.env.CLOUDFLARE_API_TOKEN || readOAuthToken();
}

const job = spawnSync(
  'pnpm',
  ['exec', 'wrangler', 'ai-search', 'jobs', 'create', INSTANCE],
  { stdio: 'inherit' }
);
if (job.status !== 0) {
  process.exit(job.status ?? 1);
}

const token = apiToken();
if (!token) {
  console.error('AI Search cache purge needs CLOUDFLARE_API_TOKEN or a Wrangler login.');
  process.exit(1);
}

const purgeUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai-search/namespaces/default/instances/${INSTANCE}/purge_cache`;
const response = await fetch(purgeUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
const payload = await response.json().catch(() => ({}));
if (!response.ok || payload.success === false) {
  const message = Array.isArray(payload.errors)
    ? payload.errors.map((error) => error.message || error.code).join('; ')
    : `HTTP ${response.status}`;
  console.error(`AI Search similarity cache purge failed: ${message}`);
  process.exit(1);
}

console.log(`AI Search sync queued and similarity cache purged for ${INSTANCE}.`);
