import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^astro:content$/, replacement: path.resolve(__dirname, 'tests/__mocks__/astro-content.ts') },
    ],
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  include: ['tests/**/*.test.{ts,tsx}'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/cypress/**',
    '**/.{idea,git,cache,output,temp}/**',
    '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    '**/*.skip.test.{ts,tsx}', // Explicitly exclude .skip.test files
  ],
  retry: 1, // enable single retry to surface flaky tests (tracked by custom reporter)
  reporters: [ 'default', './tests/reporters/flakinessReporter.ts' ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only measure modules exercised by unit tests (avoid 0% Astro islands skewing totals).
      all: false,
      include: [
        'src/config/navLinks.ts',
        'src/config/searchPages.ts',
        'src/lib/theme.ts',
        'src/components/islands/chat/MessageActions.tsx',
        'src/components/islands/chat/MessageCTAs.tsx',
        'src/components/islands/chat/MessageContent.tsx',
        'src/components/islands/chat/MessageSources.tsx',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'playwright/**',
        'playwright-report/**',
        'test-results/**',
        'coverage/**',
        'dist/**',
        '.astro/**',
        'public/**',
        'functions/**',
        'scripts/**',
        '**/*.config.*',
        '**/debug-*.js',
        '**/test-*.js',
      ],
      thresholds: {
        statements: 50,
        branches: 55,
        functions: 45,
        lines: 50,
      },
    },
  },
});
