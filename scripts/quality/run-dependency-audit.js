import { spawn } from 'node:child_process';

const outputArgs = process.argv.slice(2).filter((arg) => arg !== '--');
if (outputArgs.some((arg) => arg !== '--json')) {
  console.error(
    'The full dependency audit only accepts --json; scope and severity cannot be reduced.'
  );
  process.exit(1);
}
// pnpm 10 normalizes production=false + dev=false to include both groups.
// Reset "only" and optional as well so runner/user config cannot narrow the graph.
const auditArgs = [
  '--json',
  '--audit-level=low',
  '--production=false',
  '--dev=false',
  '--optional=true',
  '--config.only=',
  '--ignore-registry-errors=false',
];

const pnpmCli = process.env.npm_execpath;
const command = pnpmCli ? process.execPath : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const commandArgs = pnpmCli ? [pnpmCli, 'audit', ...auditArgs] : ['audit', ...auditArgs];
const audit = spawn(command, commandArgs, {
  env: process.env,
  stdio: ['ignore', 'pipe', 'inherit'],
});
const chunks = [];
audit.stdout.on('data', (chunk) => {
  chunks.push(chunk);
  process.stdout.write(chunk);
});
audit.on('error', (error) => {
  console.error(`Dependency audit could not start: ${error.message}`);
  process.exitCode = 1;
});
audit.on('close', (code) => {
  if (code !== 0) {
    process.exitCode = code && code > 0 ? code : 1;
    return;
  }
  let report;
  try {
    report = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    console.error(
      'Dependency audit did not return a valid JSON report. Retry after resolving the audit failure.'
    );
    process.exitCode = 1;
    return;
  }
  const counts = report?.metadata?.vulnerabilities;
  const severities = ['info', 'low', 'moderate', 'high', 'critical'];
  if (
    !counts ||
    !severities.every((severity) => Number.isInteger(counts[severity]) && counts[severity] >= 0)
  ) {
    console.error('Dependency audit report is missing valid vulnerability counts.');
    process.exitCode = 1;
    return;
  }
  // pnpm 10 filters info advisories from its exit status, but retains their count.
  if (Object.values(counts).some((count) => count !== 0)) {
    console.error('Dependency audit found vulnerabilities; all severities block release.');
    process.exitCode = 1;
  }
});
