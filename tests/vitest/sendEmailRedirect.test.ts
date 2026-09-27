import { describe, expect, it } from 'vitest';
import { onRequestPost } from '../../functions/send-email';

function post(body: FormData, accept = 'text/html') {
  return onRequestPost({
    request: new Request('https://blakeoxford.com/send-email', {
      method: 'POST',
      headers: { accept },
      body,
    }),
    env: {} as never,
    params: {},
    data: {},
    waitUntil: () => {},
    next: async () => new Response(null, { status: 404 }),
  });
}

describe('contact document POST', () => {
  it('redirects a no-JS invalid submit to the static error page', async () => {
    const body = new FormData();
    body.set('name', '');
    body.set('email', '');
    body.set('message', '');

    const response = await post(body);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/contact/error/invalid/');
  });

  it('keeps JSON clients on an error payload instead of redirecting', async () => {
    const body = new FormData();
    body.set('name', 'Ada');
    body.set('email', 'ada@example.com');
    body.set('message', 'A short bottleneck note.');

    const response = await post(body, 'application/json');

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});
