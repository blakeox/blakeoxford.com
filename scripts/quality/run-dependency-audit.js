import { spawnSync } from 'node:child_process';

const outputArgs = process.argv.slice(2).filter((arg) => arg !== '--');
if (outputArgs.some((arg) => arg !== '--json')) {
  console.error(
    'The full dependency audit only accepts --json; scope and severity cannot be reduced.'
  );
  process.exit(1);
}
const auditArgs = ['--audit-level=low', ...outputArgs];

const pnpmCli = process.env.npm_execpath;
const command = pnpmCli ? process.execPath : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const commandArgs = pnpmCli ? [pnpmCli, 'audit', ...auditArgs] : ['audit', ...auditArgs];
const result = spawnSync(command, commandArgs, {
  encoding: 'utf8',
  env: process.env,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) console.error(`Dependency audit could not start: ${result.error.message}`);

process.exit(result.status ?? 1);
