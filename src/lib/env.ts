/**
 * Load .env / .env.local into process.env for astro.config.mjs.
 * Astro/Vite also load env for the app; this covers config-time reads
 * (proxies, Sentry) before the Vite pipeline starts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(filename) {
  const absolutePath = resolve(process.cwd(), filename);
  if (!existsSync(absolutePath)) return;

  const contents = readFileSync(absolutePath, 'utf-8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const index = line.indexOf('=');
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    if (!key || key.startsWith('#')) continue;

    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function loadProjectEnv() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');
}
