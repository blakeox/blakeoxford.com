import { describe, expect, it } from 'vitest';
import { buildApiCorsHeaders, isAllowedApiOrigin } from '../../../functions/shared/cors';

function requestWithOrigin(origin?: string): Request {
  return {
    headers: new Headers(origin ? { origin } : undefined),
    url: 'https://blakeoxford.com/api/ai-search',
  } as Request;
}

describe('Worker API CORS policy', () => {
  it('allows the production origin with credentials', () => {
    const request = requestWithOrigin('https://blakeoxford.com');
    const headers = buildApiCorsHeaders(request);

    expect(isAllowedApiOrigin(request)).toBe(true);
    expect(headers['access-control-allow-origin']).toBe('https://blakeoxford.com');
    expect(headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not reflect an arbitrary origin', () => {
    const request = requestWithOrigin('https://evil.example');
    const headers = buildApiCorsHeaders(request);

    expect(isAllowedApiOrigin(request)).toBe(false);
    expect(headers['access-control-allow-origin']).toBeUndefined();
    expect(headers['access-control-allow-credentials']).toBeUndefined();
  });
});
