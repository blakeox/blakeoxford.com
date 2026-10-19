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
console.log(JSON.stringify(args));
if (process.env.AUDIT_TEST_ERROR) {
  console.error(process.env.AUDIT_TEST_ERROR);
  process.exit(1);
}
const fullGraph = !args.includes('--prod') && !args.includes('--dev') && !args.includes('--no-optional');
const allSeverities = args.includes('--audit-level=low');
process.exit(process.env.AUDIT_TEST_FINDING && fullGraph && allSeverities ? 1 : 0);
`
);
afterAll(() => rmSync(directory, { recursive: true, force: true }));

const audit = (env: NodeJS.ProcessEnv = {}, args: string[] = []) =>
  spawnSync(process.execPath, [wrapper, ...args], {
    encoding: 'utf8',
    env: { ...process.env, npm_execpath: fixture, ...env },
  });

describe('full dependency audit gate', () => {
  it('passes a clean full graph including optional and development dependencies', () => {
    const result = audit();
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(['audit', '--audit-level=low']);
  });

  it('fails for a low-severity development-only finding', () => {
    expect(audit({ AUDIT_TEST_FINDING: '1' }).status).toBe(1);
  });

  it.each([410, 429, 500, 503])('fails when the registry responds with %s', (status) => {
    const message = `ERR_PNPM_AUDIT_BAD_RESPONSE registry responded with ${status}`;
    const result = audit({ AUDIT_TEST_ERROR: message });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it('fails if pnpm cannot start', () => {
    expect(audit({ npm_execpath: '', PATH: directory }).status).toBe(1);
  });

  it('preserves JSON output for audit receipts', () => {
    const result = audit({}, ['--', '--json']);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(['audit', '--audit-level=low', '--json']);
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
    const result = spawnSync('bash', ['-e', '-c', script], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    });
    expect(result.stdout.trim()).toBe('security:audit');
    expect(result.status).toBe(1);
  });
});
