import { describe, expect, it } from 'vitest';
import {
  applySecurityHeaders,
  canonicalRequestUrl,
  canonicalSlashPath,
  isProductionScheduledPath,
  shouldNoindexQueryResponse,
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

describe('query URL crawl policy', () => {
  it('identifies query-bearing HTML responses for noindex headers', () => {
    expect(
      shouldNoindexQueryResponse(
        new URL('https://blakeoxford.com/projects/?filter=mdm'),
        'text/html'
      )
    ).toBe(true);
    expect(
      shouldNoindexQueryResponse(new URL('https://blakeoxford.com/projects/'), 'text/html')
    ).toBe(false);
    expect(
      shouldNoindexQueryResponse(
        new URL('https://blakeoxford.com/api/search?query=mdm'),
        'application/json'
      )
    ).toBe(false);
  });

  it('emits x-robots-tag only for query-bearing HTML responses', () => {
    const queryResponse = applySecurityHeaders(
      new Response('<html></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }),
      'test-query',
      'blakeoxford.com',
      new URL('https://blakeoxford.com/projects/?filter=mdm')
    );
    const cleanResponse = applySecurityHeaders(
      new Response('<html></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }),
      'test-clean',
      'blakeoxford.com',
      new URL('https://blakeoxford.com/projects/')
    );

    expect(queryResponse.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(cleanResponse.headers.get('x-robots-tag')).toBeNull();
  });
});
