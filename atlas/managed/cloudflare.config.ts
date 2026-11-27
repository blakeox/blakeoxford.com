import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'blakeoxford-voting-atlas',
    entrypoint: './worker.mjs',
    compatibilityDate: '2026-11-27',
    compatibilityFlags: ['nodejs_compat'],
    workersDev: false,
    previewUrls: false,
    domains: ['atlas.blakeoxford.com'],
    assets: {
      htmlHandling: 'drop-trailing-slash',
      notFoundHandling: 'none',
      runWorkerFirst: ['/mcp', '/mcp/', '/index.html'],
    },
    env: { ASSETS: bindings.assets() },
  },
});
