/**
 * Quality CLI — specialist checks live behind `pnpm quality <cmd>`.
 * Keeps package.json public surface smaller while preserving CI script names
 * that workflows still call directly.
 *
 * Usage:
 *   pnpm quality contrast
 *   pnpm quality full
 *   pnpm quality list
 */
import { spawnSync } from 'node:child_process';

/** Either a package.json script name or an argv to run via `pnpm` / `node`. */
const commands = {
  contrast: { pnpm: ['audit:contrast'] },
  'contrast:history': { pnpm: ['contrast:history'] },
  'contrast:check': { pnpm: ['contrast:check'] },
  performance: { pnpm: ['perf:test'] },
  'perf:summary': { node: ['scripts/build/performance-summary.js'] },
  'long-tasks': { node: ['scripts/quality/perf-long-tasks.js'] },
  design: { pnpm: ['design:lint'] },
  'blog-mdx-dark': { node: ['scripts/quality/blog-mdx-dark-codemod.js', '--write'] },
  security: { pnpm: ['security:audit'] },
  summary: { pnpm: ['quality:summary'] },
  badges: { pnpm: ['quality:badges'] },
  runtime: { pnpm: ['quality:runtime'] },
  flakiness: { pnpm: ['flakiness:check'] },
  'deps:age': { node: ['scripts/quality/dependency-age-monitor.js'] },
  'search:relevance': {
    node: ['--experimental-strip-types', 'scripts/quality/search-relevance-golden.js'],
  },
  'a11y:trend': { node: ['scripts/quality/a11y-trend-log.js'] },
  toxic: { node: ['scripts/quality/toxic-test-detector.js'] },
  'edge:validate': { node: ['scripts/quality/edge-validate.js'] },
  clean: {
    shell:
      "(rm -rf dist 'dist 2' .astro node_modules/.cache coverage test-results lighthouse-reports optimization-reports || true) && sleep 0.1 && (rm -rf dist 'dist 2' .astro node_modules/.cache coverage test-results lighthouse-reports optimization-reports || true)",
  },
  fast: {
    shell:
      'pnpm run typecheck && pnpm run design:lint && pnpm run lint && pnpm run format:check && pnpm exec vitest run && pnpm run test:e2e:essential:chromium && pnpm run perf:test',
  },
  full: {
    shell:
      'pnpm run typecheck && pnpm run design:lint && pnpm run lint && pnpm run format:check && pnpm exec vitest run && pnpm run test:e2e && pnpm run perf:test && pnpm run security:audit',
  },
};

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === 'list' || cmd === '--help' || cmd === '-h') {
  console.log('Available quality commands:\n');
  for (const name of Object.keys(commands).sort()) {
    console.log(`  pnpm quality ${name}`);
  }
  process.exit(0);
}

const mapped = commands[cmd];
if (!mapped) {
  console.error(`Unknown quality command: ${cmd}\nRun: pnpm quality list`);
  process.exit(1);
}

let result;
if (mapped.shell) {
  result = spawnSync(mapped.shell, {
    stdio: 'inherit',
    shell: true,
  });
} else if (mapped.node) {
  result = spawnSync(process.execPath, [...mapped.node, ...args.slice(1)], {
    stdio: 'inherit',
    shell: false,
  });
} else {
  result = spawnSync('pnpm', ['run', ...mapped.pnpm, ...args.slice(1)], {
    stdio: 'inherit',
    shell: false,
  });
}

process.exit(result.status ?? 1);
