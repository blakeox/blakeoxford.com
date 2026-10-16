import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const lhciRequire = createRequire(require.resolve('@lhci/cli/package.json'));
const utilsRequire = createRequire(lhciRequire.resolve('@lhci/utils/package.json'));
const yamlRequire = createRequire(utilsRequire.resolve('js-yaml/package.json'));
const expressRequire = createRequire(lhciRequire.resolve('express'));
const qs = expressRequire('qs');
const proxyRequire = createRequire(lhciRequire.resolve('proxy-agent'));
const pacRequire = createRequire(proxyRequire.resolve('pac-proxy-agent'));
const uriRequire = createRequire(pacRequire.resolve('get-uri'));
const ftp = uriRequire('basic-ftp');

describe('security override compatibility', () => {
  it('enforces the query array limit for bracketed comma lists', () => {
    expect(() =>
      qs.parse('a[]=1,2,3,4', { comma: true, arrayLimit: 3, throwOnLimitExceeded: true })
    ).toThrow(RangeError);
  });

  it('round-trips query keys without invoking an attacker-controlled isBuffer', () => {
    const parsed = qs.parse('x%5Bconstructor%5D%5BisBuffer%5D=y', { plainObjects: true });
    expect(() => qs.stringify(parsed)).not.toThrow();
  });

  it('retains the FTP listing and client API used by get-uri', () => {
    const [file] = ftp.parseList('-rw-r--r-- 1 owner group 42 Jan 01 2026 release.txt');
    expect(file.name).toBe('release.txt');
    expect(file.size).toBe(42);
    const client = new ftp.Client();
    try {
      for (const method of ['access', 'lastMod', 'list', 'downloadTo', 'close']) {
        expect(typeof client[method]).toBe('function');
      }
    } finally {
      client.close();
    }
  });

  it('loads Lighthouse CI YAML configuration through its installed parser', () => {
    const directory = mkdtempSync(join(tmpdir(), 'lhci-yaml-'));
    const config = join(directory, 'lighthouserc.yaml');
    try {
      writeFileSync(config, 'ci:\n  collect:\n    numberOfRuns: 2\n');
      const { loadRcFile } = utilsRequire('./src/lighthouserc.js');
      expect(loadRcFile(config)).toEqual({ ci: { collect: { numberOfRuns: 2 } } });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('retains js-yaml 3 CLI legacy flags with the replacement argument parser', () => {
    const output = execFileSync(
      process.execPath,
      [yamlRequire.resolve('./bin/js-yaml.js'), '--compact', '--to-json'],
      {
        input: 'release:\n  enabled: true\n  checks: 2\n',
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    expect(JSON.parse(output)).toEqual({ release: { enabled: true, checks: 2 } });
  });
});
