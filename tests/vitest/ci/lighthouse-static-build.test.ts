import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);

it.each(['success', 'audit-failure'])(
  'serves the configured built pages and closes the audit server after %s',
  (mode) => {
    const scratch = mkdtempSync(join(tmpdir(), 'portfolio-lhci-static-'));
    try {
      const output = execFileSync(
        process.execPath,
        [
          '-e',
          String.raw`const { createRequire } = require('node:module');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { connect } = require('node:net');
const cli = createRequire(process.argv[1]);
const config = JSON.parse(readFileSync(process.argv[2], 'utf8')).ci.collect;
const mode = process.argv[3];
const paths = ['/', '/about/', '/blog/', '/projects/', '/contact/'];
for (const pathname of paths) {
  const file = join('dist', pathname, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, '<!doctype html><title>Built page</title>fixture:' + pathname.replace(/\/$/, ''));
}
const utils = cli('@lhci/utils/src/saved-reports.js');
utils.saveLHR = async () => {};
const Server = cli('./src/collect/fallback-server.js');
const listen = Server.prototype.listen;
let ownedPort;
Server.prototype.listen = async function () { await listen.call(this); ownedPort = String(this.port); };
const Runner = cli('./src/collect/node-runner.js');
const seen = [];
Runner.prototype.runUntilSuccess = async (url) => {
  const parsed = new URL(url);
  if (!ownedPort || parsed.port !== ownedPort) throw Error('Collector used the external development server');
  const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (response.redirected) throw Error('Audit target redirected');
  const body = await response.text();
  if (!response.ok || !body.includes('fixture:' + parsed.pathname.replace(/\/$/, ''))) throw Error('Wrong built page');
  seen.push({ url, pathname: parsed.pathname, status: response.status });
  if (mode === 'audit-failure') throw Error('intentional audit failure');
  return '{}';
};
const write = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk) => process.stderr.write(chunk);
(async () => {
  try {
    await cli('./src/collect/collect.js').runCommand(config);
    if (mode === 'audit-failure') throw Error('Expected audit failure');
  } catch (error) {
    if (mode !== 'audit-failure' || error.message !== 'intentional audit failure') throw error;
  }
  if (!seen.length) throw Error('No built page was served');
  const closed = await new Promise((resolve, reject) => {
    const probe = connect({ host: 'localhost', port: Number(ownedPort) });
    probe.once('connect', () => { probe.destroy(); resolve(false); });
    probe.once('error', error => error.code === 'ECONNREFUSED' ? resolve(true) : reject(error));
    probe.setTimeout(2000, () => { probe.destroy(); reject(Error('Cleanup probe timed out')); });
  });
  if (!closed) throw Error('Audit server remained open');
  write(JSON.stringify({ seen, closed }));
})().catch(error => { console.error(error); process.exitCode = 1; });`,
          require.resolve('@lhci/cli/package.json'),
          join(process.cwd(), 'lighthouserc.json'),
          mode,
        ],
        { cwd: scratch, encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] }
      );
      const result = JSON.parse(output) as {
        seen: Array<{ pathname: string; status: number }>;
        closed: boolean;
      };
      expect(result.closed).toBe(true);
      expect(result.seen.every((page) => page.status === 200)).toBe(true);
      expect(result.seen.map((page) => page.pathname)).toEqual(
        mode === 'success'
          ? [
              '/',
              '/',
              '/about/',
              '/about/',
              '/blog/',
              '/blog/',
              '/projects/',
              '/projects/',
              '/contact/',
              '/contact/',
            ]
          : ['/']
      );
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
);
