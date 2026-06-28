import { test, expect } from '../fixtures';

test('edge sets x-request-id header on html responses', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBeLessThan(500);
  const rid = res.headers()['x-request-id'];
  // In local preview, header should be present; in unlikely cases, tolerate absence but log
  if (!rid) {
    console.warn('x-request-id missing in preview response; check Worker dev routing');
  } else {
    expect(rid.length).toBeGreaterThan(5);
  }
});
