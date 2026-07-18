import { spawnSync } from 'node:child_process';

const auditArgs = process.argv.slice(2).filter((arg) => arg !== '--');
if (!auditArgs.some((arg) => arg.startsWith('--audit-level')))
  auditArgs.push('--audit-level=moderate');
if (!auditArgs.includes('--prod')) auditArgs.push('--prod');

const pnpmCli = process.env.npm_execpath;
const command = pnpmCli ? process.execPath : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const commandArgs = pnpmCli ? [pnpmCli, 'audit', ...auditArgs] : ['audit', ...auditArgs];
const result = spawnSync(command, commandArgs, {
  encoding: 'utf8',
  env: process.env,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) process.exit(0);

const output = `${result.stdout || ''}\n${result.stderr || ''}`;
const registryUnavailable =
  output.includes('ERR_PNPM_AUDIT_BAD_RESPONSE') &&
  /responded with (?:410|429|5\d\d)\b/.test(output);

if (registryUnavailable) {
  console.warn(
    '::warning title=Dependency audit unavailable::The npm audit endpoint is unavailable; CodeQL and dependency scanning remain active.'
  );
  process.exit(0);
}

process.exit(result.status ?? 1);
