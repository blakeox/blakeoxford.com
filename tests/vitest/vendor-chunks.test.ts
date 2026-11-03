import { describe, expect, it } from 'vitest';
import { vendorChunkName } from '../../src/lib/vendor-chunks';

const reactDom =
  '/workspace/node_modules/.pnpm/react-dom@19.3.1_react@19.3.1/node_modules/react-dom/cjs/react-dom-client.production.js';
const react = '/workspace/node_modules/.pnpm/react@19.3.1/node_modules/react/index.js';
const scheduler = '/workspace/node_modules/.pnpm/scheduler@0.28.0/node_modules/scheduler/index.js';
const zod = '/workspace/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/errors.js';
const sentry =
  '/workspace/node_modules/.pnpm/@sentry+browser@11.9.0/node_modules/@sentry/browser/build/npm/esm/prod/sdk.js';
const astroReact =
  '/workspace/node_modules/.pnpm/@astrojs+react@7.1.0/node_modules/@astrojs/react/dist/client.js';

describe('vendor chunk names', () => {
  it.each([
    [react, 'vendor-react'],
    [reactDom, 'vendor-react'],
    [scheduler, 'vendor-react'],
    [sentry, 'vendor-sentry'],
    [zod, 'vendor-zod'],
  ])('places %s in %s', (id, chunk) => {
    expect(vendorChunkName(id)).toBe(chunk);
  });

  it('leaves the Astro React renderer and virtual modules out of the React package chunk', () => {
    expect(vendorChunkName(astroReact)).toBeUndefined();
    expect(vendorChunkName('\0astro:react:opts')).toBeUndefined();
    expect(vendorChunkName('/workspace/src/scripts/sentry-loader.ts')).toBeUndefined();
  });

  it('does not use a catch-all vendor name', () => {
    expect(
      vendorChunkName('/workspace/node_modules/.pnpm/zod@4.6.7/node_modules/zod/index.js')
    ).not.toBe('vendor');
  });
});
