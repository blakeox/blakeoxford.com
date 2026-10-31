import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertWorkerSourceMaps,
  workerSourceMapCommands,
} from '../../scripts/deploy/upload-sentry-worker-sourcemaps.mjs';

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('Worker source-map release contract', () => {
  it('keeps unconfigured recovery deployments independent of Sentry', () => {
    expect(workerSourceMapCommands({})).toBeNull();
  });
  it('rejects missing upload credentials when browser reporting is configured', () => {
    expect(() => workerSourceMapCommands({ PUBLIC_SENTRY_DSN: 'configured' })).toThrow(
      'SENTRY_AUTH_TOKEN'
    );
  });
  it('uses the exact Workers Build revision and keeps the secret out of arguments', () => {
    const commands = workerSourceMapCommands({
      SENTRY_AUTH_TOKEN: 'private-build-fixture',
      WORKERS_CI_COMMIT_SHA: 'deployed-revision',
      GIT_COMMIT: 'stale-revision',
    });
    expect(commands?.[0]?.slice(0, 3)).toEqual(['releases', 'new', 'deployed-revision']);
    expect(commands?.[1]).toContain('deployed-revision');
    expect(commands?.[1]).toContain('--strict');
    expect(commands?.[1]).toContain('--wait-for');
    expect(JSON.stringify(commands)).not.toContain('private-build-fixture');
  });
  it('supports manual revisions and refuses an unknown release', () => {
    expect(
      workerSourceMapCommands({
        SENTRY_AUTH_TOKEN: 'fixture',
        GIT_COMMIT: 'manual-revision',
      })?.[0]?.[2]
    ).toBe('manual-revision');
    expect(
      workerSourceMapCommands({ SENTRY_AUTH_TOKEN: 'fixture' }, 'checkout-revision')?.[0]?.[2]
    ).toBe('checkout-revision');
    expect(() => workerSourceMapCommands({ SENTRY_AUTH_TOKEN: 'fixture' })).toThrow('revision');
  });
  it('rejects absent maps and accepts only matching JavaScript/map pairs', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sentry-worker-maps-'));
    temporaryDirectories.push(directory);
    expect(() => assertWorkerSourceMaps(directory)).toThrow('matching source maps');
    writeFileSync(join(directory, 'index.js'), 'export default {}');
    expect(() => assertWorkerSourceMaps(directory)).toThrow('matching source maps');
    writeFileSync(join(directory, 'index.js.map'), '{}');
    expect(assertWorkerSourceMaps(directory)).toEqual(['index.js']);
  });
});
