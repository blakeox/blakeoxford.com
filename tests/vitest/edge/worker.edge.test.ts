import { describe, expect, it } from 'vitest';
import {
  canonicalRequestUrl,
  canonicalSlashPath,
  isProductionScheduledPath,
} from '../../../functions/index';

describe('production scheduled endpoint hardening', () => {
  it('blocks the local scheduled trigger endpoint in production', () => {
    expect(isProductionScheduledPath('/__scheduled', 'production')).toBe(true);
  });

  it('does not block the path outside production', () => {
    expect(isProductionScheduledPath('/__scheduled', 'development')).toBe(false);
    expect(isProductionScheduledPath('/healthz', 'production')).toBe(false);
  });
});

describe('canonical public route slashes', () => {
  it('adds a trailing slash only to known page routes', () => {
    expect(canonicalSlashPath('/projects/microsoft-fabric')).toBe('/projects/microsoft-fabric/');
    expect(canonicalSlashPath('/about')).toBe('/about/');
  });

  it('does not rewrite assets, APIs, or already canonical paths', () => {
    expect(canonicalSlashPath('/assets/app.js')).toBeNull();
    expect(canonicalSlashPath('/api/search')).toBeNull();
    expect(canonicalSlashPath('/blog/')).toBeNull();
  });

  it('combines host, protocol, and slash normalization into one redirect', () => {
    expect(canonicalRequestUrl(new URL('http://www.blakeoxford.com/about'))?.toString()).toBe(
      'https://blakeoxford.com/about/'
    );
    expect(canonicalRequestUrl(new URL('https://blakeoxford.com/about/'))).toBeNull();
  });
});
