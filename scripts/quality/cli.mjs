/**
 * Quality CLI — specialist checks live behind `pnpm quality <cmd>`.
 * Keeps package.json public surface smaller while preserving CI script names.
 *
 * Usage:
 *   pnpm quality contrast
 *   pnpm quality full
 *   pnpm quality performance
 *   pnpm quality list
 */
import { spawnSync } from 'node:child_process';

const commands = {
  contrast: ['audit:contrast'],
  'contrast:history': ['contrast:history'],
  'contrast:check': ['contrast:check'],
  performance: ['perf:test'],
  full: ['ci:full'],
  fast: ['ci:fast'],
  design: ['design:lint'],
  security: ['security:audit'],
  summary: ['quality:summary'],
  badges: ['quality:badges'],
  runtime: ['quality:runtime'],
  flakiness: ['flakiness:check'],
};

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === 'list' || cmd === '--help' || cmd === '-h') {
  console.log('Available quality commands:\n');
  for (const name of Object.keys(commands).sort()) {
    console.log(`  pnpm quality ${name}`);
  }
  process.exit(cmd && cmd !== 'list' ? 0 : 0);
}

const mapped = commands[cmd];
if (!mapped) {
  console.error(`Unknown quality command: ${cmd}\nRun: pnpm quality list`);
  process.exit(1);
}

const result = spawnSync('pnpm', ['run', ...mapped, ...args.slice(1)], {
  stdio: 'inherit',
  shell: false,
});
process.exit(result.status ?? 1);
