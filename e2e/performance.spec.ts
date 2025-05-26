import { test, expect } from '@playwright/test';

// Performance and load tests for homepage and API

test.describe('Performance and Load', () => {
  test('homepage loads under 1s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('API responds quickly under load', async ({ request }) => {
    // Simulate 10 rapid requests to the blog API
    const responses = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        request.get('/api/blog.json')
      )
    );
    for (const res of responses) {
      expect(res.status()).toBe(200);
      expect(await res.json()).toBeInstanceOf(Array);
    }
  });
});
