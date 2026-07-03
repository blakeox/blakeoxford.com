#!/usr/bin/env node
/**
 * Prebuild — sync Astro content, then generate search JSON from source files.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sync = spawnSync('npx', ['astro', 'sync'], {
  stdio: 'inherit',
  shell: false,
});

if (sync.status !== 0) {
  process.exit(sync.status === null ? 1 : sync.status);
}

await import(path.join(__dirname, 'generate-search-index-from-files.mjs'));
