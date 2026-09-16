import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publicAssetExists, resolvePublicImage } from '../../src/lib/media/publicAssetExists';

describe('publicAssetExists', () => {
  it('returns the first existing public image and skips missing or empty frames', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'public-asset-'));
    mkdirSync(join(cwd, 'public/assets'), { recursive: true });
    writeFileSync(join(cwd, 'public/assets/present.png'), Buffer.alloc(9_000, 1));
    writeFileSync(join(cwd, 'public/assets/tiny.png'), 'x');

    expect(publicAssetExists('/assets/present.png', cwd)).toBe(true);
    expect(publicAssetExists('/assets/tiny.png', cwd)).toBe(false);
    expect(publicAssetExists('/assets/missing.png', cwd)).toBe(false);
    expect(resolvePublicImage('/assets/missing.png', '/assets/present.png', cwd)).toBe(
      '/assets/present.png'
    );
    expect(resolvePublicImage('/assets/tiny.png', '/assets/missing.png', cwd)).toBeUndefined();
    expect(resolvePublicImage('/assets/projects/diagram.png', '/assets/present.png', cwd)).toBe(
      '/assets/present.png'
    );

    mkdirSync(join(cwd, 'public/assets/projects'), { recursive: true });
    writeFileSync(join(cwd, 'public/assets/projects/diagram.png'), Buffer.alloc(9_000, 1));
    expect(resolvePublicImage('/assets/projects/diagram.png', undefined, cwd)).toBeUndefined();

    rmSync(cwd, { recursive: true, force: true });
  });
});
