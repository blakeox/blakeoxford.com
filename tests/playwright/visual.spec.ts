// tests/playwright/visual.spec.ts
import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'Projects', path: '/projects' },
  { name: 'Contact', path: '/contact' },
];

for (const page of pages) {
  test(`Visual regression test for ${page.name} page`, async ({ page: playwrightPage }) => {
    await playwrightPage.goto(page.path);
    await expect(playwrightPage).toHaveScreenshot({ fullPage: true, maxDiffPixels: 100 });
  });
}
