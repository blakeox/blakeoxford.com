import { describe, expect, it } from 'vitest';
import { handleDebug } from '../../../functions/routes/debug';

function routeContext(pathname: string) {
  return {
    url: new URL(`https://blakeoxford.com${pathname}`),
    reqId: 'test-request-id',
  } as any;
}

describe('debug route hardening', () => {
  it.each(['/debug/sentry-test', '/debug/sentry-test/'])('blocks %s', (pathname) => {
    const response = handleDebug(routeContext(pathname));

    expect(response?.status).toBe(404);
    expect(response?.headers.get('cache-control')).toBe('no-store');
    expect(response?.headers.get('x-route-kind')).toBe('blocked-debug');
  });

  it('does not intercept normal routes', () => {
    expect(handleDebug(routeContext('/'))).toBeNull();
  });
});
