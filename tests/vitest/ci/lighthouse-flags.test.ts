import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);

it('passes separate container flags through the pinned Lighthouse CI adapter', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'portfolio-lhci-flags-'));
  try {
    const output = execFileSync(
      process.execPath,
      [
        '-e',
        `const fs = require('node:fs');
const Runner = require(process.argv[1]);
const settings = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).ci.collect.settings;
fs.mkdirSync('.lighthouseci');
const result = Runner.computeArgumentsAndCleanup('http://localhost:4321/', { settings });
const flagPath = result.args[result.args.indexOf('--cli-flags-path') + 1];
const flags = JSON.parse(fs.readFileSync(flagPath, 'utf8')).chromeFlags;
result.cleanupFn();
process.stdout.write(JSON.stringify(flags));`,
        require.resolve('@lhci/cli/src/collect/node-runner.js'),
        join(process.cwd(), 'lighthouserc.json'),
      ],
      { cwd: scratch, encoding: 'utf8', timeout: 10000 }
    );
    const flags = (JSON.parse(output) as string).trim().split(/\s+/);

    expect(flags).toContain('--no-sandbox');
    expect(flags).toContain('--disable-dev-shm-usage');
    expect(flags).toContain('--headless=new');
    expect(flags).not.toContain('--disable-web-security');
    expect(flags.some((flag) => flag.startsWith('--ignore-certificate-errors'))).toBe(false);
    expect(flags.some((flag) => flag.includes(','))).toBe(false);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
