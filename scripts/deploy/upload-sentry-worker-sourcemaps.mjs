import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function workerSourceMapCommands(env, fallbackRevision) {
  if (!env.SENTRY_AUTH_TOKEN) {
    if (env.PUBLIC_SENTRY_DSN)
      throw new Error('SENTRY_AUTH_TOKEN is required for configured Sentry builds');
    return null;
  }
  const release = env.WORKERS_CI_COMMIT_SHA || env.GIT_COMMIT || fallbackRevision;
  if (!release) throw new Error('A deployed revision is required for Worker source maps');
  const org = env.SENTRY_ORG || 'accelerise-consulting';
  const project = env.SENTRY_PROJECT || 'blakeoxford-com';
  return [
    ['releases', 'new', release, '--org', org, '--project', project],
    [
      'sourcemaps',
      'upload',
      '--org',
      org,
      '--project',
      project,
      '--release',
      release,
      '--strip-prefix',
      resolve('.wrangler'),
      '--validate',
      '--strict',
      '--wait-for',
      '60',
      '.wrangler/sentry',
    ],
  ];
}

export function assertWorkerSourceMaps(directory) {
  const files = readdirSync(directory);
  const scripts = files.filter((name) => /\.(?:js|mjs|cjs)$/.test(name));
  if (!scripts.length || scripts.some((name) => !files.includes(`${name}.map`))) {
    throw new Error('Worker JavaScript and matching source maps are required before upload');
  }
  return scripts;
}

function main() {
  let fallbackRevision;
  if (
    process.env.SENTRY_AUTH_TOKEN &&
    !process.env.WORKERS_CI_COMMIT_SHA &&
    !process.env.GIT_COMMIT
  ) {
    fallbackRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  }
  const commands = workerSourceMapCommands(process.env, fallbackRevision);
  if (!commands) {
    console.info('Sentry Worker source-map upload is not configured for this environment');
    return;
  }
  const directory = '.wrangler/sentry';
  const scripts = assertWorkerSourceMaps(directory);
  for (const name of scripts) {
    console.info(
      JSON.stringify({
        workerArtifact: name,
        sha256: createHash('sha256')
          .update(readFileSync(join(directory, name)))
          .digest('hex'),
      })
    );
  }
  for (const args of commands) {
    const result = spawnSync(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['exec', 'sentry-cli', ...args],
      { stdio: 'inherit', shell: false }
    );
    if (result.error || result.status !== 0)
      throw new Error(
        `Sentry Worker source-map step failed (exit ${result.status ?? 'unavailable'})`
      );
  }
  console.info('Sentry Worker source-map upload completed');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Sentry Worker source-map upload failed'
    );
    process.exitCode = 1;
  }
}
