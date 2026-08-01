import { describe, expect, it } from 'vitest';
import { handleTheme } from '../../../functions/routes/theme';

function context(origin: string, body: string, method = 'POST') {
  return {
    request: {
      method,
      headers: new Headers({ origin, 'content-type': 'application/json' }),
      json: async () => JSON.parse(body),
    },
    url: new URL('https://blakeoxford.com/api/set-theme'),
    reqId: 'test-request-id',
  } as any;
}

describe('theme route CORS policy', () => {
  it('rejects arbitrary credentialed origins', async () => {
    const response = await handleTheme(context('https://evil.example', '{"theme":"dark"}'));

    expect(response?.status).toBe(403);
    expect(response?.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('sets the theme cookie for the production origin', async () => {
    const response = await handleTheme(context('https://blakeoxford.com', '{"theme":"dark"}'));

    expect(response?.status).toBe(200);
    expect(response?.headers.get('access-control-allow-origin')).toBe('https://blakeoxford.com');
  });
});
