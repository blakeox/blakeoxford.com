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
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
      },
    },
    globals: true,
    setupFiles: './vitest.setup.ts',
  include: ['tests/**/*.test.{ts,tsx}'],
  retry: 1, // enable single retry to surface flaky tests (tracked by custom reporter)
  reporters: [ 'default', './tests/reporters/flakinessReporter.ts' ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/config/navLinks.ts',
        'src/utils/slug.ts',
        'src/content/config.ts',
        'src/components/**/*.tsx',
        'src/scripts/**/*.ts',
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
        'src/pages/**', // Exclude Astro pages
        'src/layouts/**', // Exclude Astro layouts
        'src/content/**', // Exclude content collections
        'src/middleware/**', // Exclude middleware
        'src/types/**', // Exclude type definitions
        'src/styles/**', // Exclude styles
        'src/assets/**', // Exclude assets
        'src/utils/**', // Exclude most utils except specific ones
        'src/scripts/**', // Exclude scripts except specific ones
      ],
      thresholds: {
        statements: 15, // Realistic for Astro SSG with utility-focused tests
        branches: 70,
        functions: 25, // Focus on critical functions
        lines: 15,
      }
    },
  },
});
