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

describe('security override compatibility', () => {
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
