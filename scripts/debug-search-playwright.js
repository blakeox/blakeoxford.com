/* global document, window */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript({ path: './tests/assets/search-debug-manual.js' });
  await page.goto('http://localhost:4330/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const canOpen = await page.evaluate(() => typeof globalThis.testSearchInstance?.open === 'function');
  console.log('canOpen', canOpen);
  await page.evaluate(() => globalThis.testSearchInstance.open());
  await page.waitForTimeout(200);
  const info = await page.evaluate(() => {
    const el = document.querySelector('.search-result');
    if (!el) return { exists: false };
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const overlay = document.getElementById('search-overlay');
    const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
    return {
      exists: true,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      style: { display: style.display, visibility: style.visibility, opacity: style.opacity },
      overlay: {
        class: overlay?.className,
        inlineDisplay: overlay?.style.display,
        ariaHidden: overlay?.getAttribute('aria-hidden'),
        datasetState: overlay?.dataset.state,
        overlayStyle: overlayStyle ? { display: overlayStyle.display, visibility: overlayStyle.visibility, opacity: overlayStyle.opacity } : null
      }
    };
  });
  console.log('INFO', info);
  await browser.close();
})();
