import { describe, expect, it } from 'vitest';
import {
  createSentryAllowedUrls,
  resolveBrowserSentryEnvironment,
} from '../../src/lib/sentry-options';

describe('resolveBrowserSentryEnvironment', () => {
  it('prefers the configured Workers Build environment', () => {
    expect(
      resolveBrowserSentryEnvironment({
        configured: 'verification',
        mode: 'production',
        hostname: 'testing-blakeoxford-com.blakeoxford.workers.dev',
      })
    ).toBe('verification');
  });

  it('treats workers.dev hosts as preview when MODE is production', () => {
    expect(
      resolveBrowserSentryEnvironment({
        mode: 'production',
        hostname: 'testing-blakeoxford-com.blakeoxford.workers.dev',
      })
    ).toBe('preview');
  });

  it('keeps production hostnames on production when MODE is production', () => {
    expect(
      resolveBrowserSentryEnvironment({
        mode: 'production',
        hostname: 'blakeoxford.com',
      })
    ).toBe('production');
  });

  it('falls back to MODE when the host is unrecognized', () => {
    expect(resolveBrowserSentryEnvironment({ mode: 'development', hostname: 'localhost' })).toBe(
      'development'
    );
  });
});

describe('Sentry owned deployment URLs', () => {
  it.each(['http://127.0.0.1:65029/app.js', 'http://localhost:4321/app.js'])(
    'allows loopback only in an explicit verification build: %s',
    (url) => {
      expect(createSentryAllowedUrls('verification').some((pattern) => pattern.test(url))).toBe(
        true
      );
      for (const environment of ['production', 'preview']) {
        expect(createSentryAllowedUrls(environment).some((pattern) => pattern.test(url))).toBe(
          false
        );
      }
    }
  );
  it('rejects a loopback hostname suffix spoof during verification', () => {
    expect(
      createSentryAllowedUrls('verification').some((pattern) =>
        pattern.test('http://localhost.example.org/app.js')
      )
    ).toBe(false);
  });
  it.each(['production', 'preview', 'verification'])('allows production in %s', (environment) => {
    const allowed = createSentryAllowedUrls(environment);
    expect(allowed.some((pattern) => pattern.test('https://blakeoxford.com/_astro/app.js'))).toBe(
      true
    );
    expect(allowed.some((pattern) => pattern.test('https://www.blakeoxford.com/app.js'))).toBe(
      true
    );
  });
  it('allows only this Worker and account in previews', () => {
    const url =
      'https://feature-sentry-project-wiring-blakeoxford-com.blakeoxford.workers.dev/_astro/app.js';
    expect(createSentryAllowedUrls('preview').some((pattern) => pattern.test(url))).toBe(true);
    expect(createSentryAllowedUrls('production').some((pattern) => pattern.test(url))).toBe(false);
  });
  it.each([
    'https://blakeoxford.com.example.org/app.js',
    'https://example.org/blakeoxford.com/app.js',
    'https://feature-other-worker.blakeoxford.workers.dev/app.js',
    'https://feature-blakeoxford-com.other-account.workers.dev/app.js',
    'https://feature-blakeoxford-com.blakeoxford.workers.dev.example.org/app.js',
  ])('rejects an unrelated URL: %s', (url) => {
    expect(createSentryAllowedUrls('preview').some((pattern) => pattern.test(url))).toBe(false);
  });
});
