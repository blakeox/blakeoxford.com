import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  applySecurityHeaders,
  canonicalRequestUrl,
  canonicalSlashPath,
  createUnmatchedApiResponse,
  ensureHtmlCharset,
  isProductionScheduledPath,
  isUnmatchedApiPath,
  shouldNoindexQueryResponse,
} from '../../../functions/index';
import { CONTENT_SECURITY_POLICY } from '../../../src/config/content-security-policy.ts';

describe('Sentry browser transport policy', () => {
  it('allows the app ingest origin and replay workers without broader script execution', () => {
    const response = applySecurityHeaders(
      new Response('<html></html>', { headers: { 'content-type': 'text/html' } }),
      'sentry-csp',
      'blakeoxford.com',
      new URL('https://blakeoxford.com/')
    );
    const policy = response.headers.get('content-security-policy') || '';
    const connections = policy.match(/connect-src ([^;]+)/)?.[1]?.split(/\s+/) || [];
    const workers = policy.match(/worker-src ([^;]+)/)?.[1]?.split(/\s+/) || [];
    const scripts = policy.match(/script-src ([^;]+)/)?.[1]?.split(/\s+/) || [];

    const sentryConnections = connections.filter((source) => {
      try {
        const hostname = new URL(source).hostname;
        return hostname === 'sentry.io' || hostname.endsWith('.sentry.io');
      } catch {
        return false;
      }
    });
    expect(sentryConnections).toEqual(['https://o4512297421897728.ingest.us.sentry.io']);
    expect(workers).toEqual(["'self'", 'blob:']);
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it('keeps the static asset policy identical to the Worker policy', () => {
    const staticHeaders = readFileSync('_headers', 'utf8');
    expect(staticHeaders.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1]).toBe(
      CONTENT_SECURITY_POLICY
    );
  });
});

describe('production scheduled endpoint hardening', () => {
  it('blocks the local scheduled trigger endpoint in production', () => {
    expect(isProductionScheduledPath('/__scheduled', 'production')).toBe(true);
  });

  it('does not block the path outside production', () => {
    expect(isProductionScheduledPath('/__scheduled', 'development')).toBe(false);
    expect(isProductionScheduledPath('/healthz', 'production')).toBe(false);
  });
});

describe('unmatched API paths', () => {
  it('routes unknown API requests to a 404 boundary before static assets', () => {
    expect(isUnmatchedApiPath('/api/graphql')).toBe(true);
    expect(isUnmatchedApiPath('/api/unknown')).toBe(true);
    expect(isUnmatchedApiPath('/api')).toBe(true);
    expect(isUnmatchedApiPath('/apiary')).toBe(false);
    expect(isUnmatchedApiPath('/projects/')).toBe(false);
  });

  it('preserves API route and no-store diagnostic headers on the 404', () => {
    const response = createUnmatchedApiResponse();

    expect(response.status).toBe(404);
    expect(response.headers.get('x-route-kind')).toBe('api');
    expect(response.headers.get('x-cache-policy')).toBe('no-store');
    expect(response.headers.get('cache-control')).toBe('no-store');
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

  it('allows Google Tag Manager and Analytics in the CSP', () => {
    expect(CONTENT_SECURITY_POLICY).toContain('https://www.googletagmanager.com');
    expect(CONTENT_SECURITY_POLICY).toContain('https://www.google-analytics.com');
    expect(CONTENT_SECURITY_POLICY).not.toContain('https://cdn-cgi/');
  });

  it('adds charset=utf-8 to HTML responses missing a charset', () => {
    const response = ensureHtmlCharset(
      new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
    );
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
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
