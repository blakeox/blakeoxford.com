import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'dependency-audit-'));
const fixture = join(directory, 'pnpm.cjs');
const wrapper = resolve('scripts/quality/run-dependency-audit.js');
writeFileSync(
  fixture,
  `const args = process.argv.slice(2);
if (process.env.AUDIT_TEST_ERROR) {
  console.error(process.env.AUDIT_TEST_ERROR);
  process.exit(1);
}
if (process.env.AUDIT_TEST_SIGNAL) process.kill(process.pid, 'SIGTERM');
if (process.env.AUDIT_TEST_INVALID) {
  console.log(process.env.AUDIT_TEST_INVALID);
  process.exit(0);
}
const counts = {info: 0, low: 0, moderate: 0, high: 0, critical: 0};
if (process.env.AUDIT_TEST_FINDING) counts[process.env.AUDIT_TEST_FINDING] = 1;
const report = {advisories: {}, muted: [], metadata: {vulnerabilities: counts}, auditTestArgs: args};
if (process.env.AUDIT_TEST_LARGE) report.padding = 'x'.repeat(2 * 1024 * 1024);
console.log(JSON.stringify(report));
// pnpm 10 can report info in metadata while exiting successfully.
process.exitCode = counts.low ? 1 : 0;
`
);
afterAll(() => rmSync(directory, { recursive: true, force: true }));

const audit = (env: NodeJS.ProcessEnv = {}, args: string[] = []) =>
  spawnSync(process.execPath, [wrapper, ...args], {
    encoding: 'utf8',
    env: { ...process.env, npm_execpath: fixture, ...env },
    maxBuffer: 4 * 1024 * 1024,
  });

const fullAuditArgs = [
  'audit',
  '--json',
  '--audit-level=low',
  '--production=false',
  '--dev=false',
  '--optional=true',
  '--config.only=',
  '--ignore-registry-errors=false',
];

describe('full dependency audit gate', () => {
  it('passes a clean full graph including optional and development dependencies', () => {
    const result = audit();
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).auditTestArgs).toEqual(fullAuditArgs);
  });

  it('fails for a low-severity development-only finding', () => {
    expect(audit({ AUDIT_TEST_FINDING: 'low' }).status).toBe(1);
  });

  it.each([410, 429, 500, 503])('fails when the registry responds with %s', (status) => {
    const message = `ERR_PNPM_AUDIT_BAD_RESPONSE registry responded with ${status}`;
    const result = audit({ AUDIT_TEST_ERROR: message });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it('fails for informational advisories even when pnpm exits successfully', () => {
    expect(audit({ AUDIT_TEST_FINDING: 'info' }).status).toBe(1);
  });

  it('overrides inherited production-only and optional-dependency settings', () => {
    const result = audit({
      npm_config_production: 'true',
      npm_config_optional: 'false',
      npm_config_only: 'prod',
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).auditTestArgs).toEqual(fullAuditArgs);
  });

  it('streams a complete report larger than the default subprocess buffer', () => {
    const result = audit({ AUDIT_TEST_LARGE: '1' }, ['--json']);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).padding).toHaveLength(2 * 1024 * 1024);
  });

  it.each(['not JSON', '{}', '{"metadata":{"vulnerabilities":{"info":0}}}'])(
    'fails on an unavailable or incomplete report: %s',
    (output) => {
      expect(audit({ AUDIT_TEST_INVALID: output }).status).toBe(1);
    }
  );

  it('fails when the audit process is terminated by a signal', () => {
    expect(audit({ AUDIT_TEST_SIGNAL: '1' }).status).toBe(1);
  });

  it('fails if pnpm cannot start', () => {
    expect(audit({ npm_execpath: '', PATH: directory }).status).toBe(1);
  });

  it('preserves JSON output for audit receipts', () => {
    const result = audit({}, ['--', '--json']);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).auditTestArgs).toEqual(fullAuditArgs);
  });

  it.each(['--prod', '--dev', '--no-optional', '--audit-level=high', '--ignore-registry-errors'])(
    'rejects arguments that weaken the gate: %s',
    (argument) => {
      expect(audit({}, [argument]).status).toBe(1);
    }
  );
});

describe.each(['ci-fast', 'security'])('%s audit step', (workflow) => {
  it('runs the shared full audit and propagates a failure', () => {
    const source = readFileSync(`.github/workflows/${workflow}.yml`, 'utf8');
    const step = source.match(
      /\x20{6}- name: [^\n]*audit[^\n]*\n[\s\S]*?(?=\n\x20{6}- name:)/i
    )?.[0];
    expect(step).toBeDefined();
    expect(step).not.toMatch(/continue-on-error:|\bif:/);
    const script = step!
      .split('        run: ')[1]
      .replace(/^\|\n/, '')
      .replace(/^ {10}/gm, '');
    const executable = join(directory, 'pnpm');
    writeFileSync(executable, '#!/bin/sh\nprintf "%s\\n" "$*"\nexit 1\n', { mode: 0o755 });
    const shellScript = script.replace(/\bpnpm\b/g, `'${executable}'`);
    const result = spawnSync('bash', ['-e', '-c', shellScript], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    });
    expect(result.stdout.trim()).toBe('security:audit');
    expect(result.status).toBe(1);
  });
});
