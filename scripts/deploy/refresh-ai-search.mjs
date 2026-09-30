/**
 * Re-index the public site in AI Search and drop cached answers so a content
 * deploy is not served from the previous crawl.
 *
 * Clears the platform similarity cache and the application's seven-day
 * `ai:response:v4:` KV entries. Conversation backups use a different prefix
 * and stay in place.
 *
 * Uses CLOUDFLARE_API_TOKEN in CI. Locally, falls back to the Wrangler OAuth
 * token without printing it.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const INSTANCE = 'bold-heart-18e4';
const ACCOUNT_ID = 'cc3bb24ae3c87cff38c2be85df3dab29';
const AI_RESPONSE_CACHE_ID = '88ac13a34f474753bd44450267bd2206';
const AI_RESPONSE_KEY_PREFIX = 'ai:response:v4:';

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

function apiError(payload, status) {
  return Array.isArray(payload.errors)
    ? payload.errors.map((error) => error.message || error.code).join('; ')
    : `HTTP ${status}`;
}

export async function purgeAiResponseCache({
  token,
  accountId = ACCOUNT_ID,
  namespaceId = AI_RESPONSE_CACHE_ID,
  prefix = AI_RESPONSE_KEY_PREFIX,
  fetchImpl = fetch,
}) {
  const keys = [];
  let cursor = '';
  do {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`
    );
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('limit', '1000');
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(`AI response cache list failed: ${apiError(payload, response.status)}`);
    }
    for (const item of payload.result || []) {
      if (typeof item?.name === 'string' && item.name.startsWith(prefix)) keys.push(item.name);
    }
    cursor = payload.result_info?.cursor || '';
  } while (cursor);

  for (let index = 0; index < keys.length; index += 10000) {
    const batch = keys.slice(index, index + 10000);
    const response = await fetchImpl(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk/delete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(batch),
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(`AI response cache delete failed: ${apiError(payload, response.status)}`);
    }
  }

  return keys.length;
}

async function main() {
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
    console.error(`AI Search similarity cache purge failed: ${apiError(payload, response.status)}`);
    process.exit(1);
  }

  try {
    const deleted = await purgeAiResponseCache({ token });
    console.log(
      `AI Search sync queued, similarity cache purged, and ${deleted} cached answers deleted for ${INSTANCE}.`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'AI response cache purge failed.');
    process.exit(1);
  }
}

const isDirectRun = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  await main();
}
