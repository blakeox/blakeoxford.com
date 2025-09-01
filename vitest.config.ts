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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/config/**/*.ts',
        'src/utils/**/*.ts',
        'src/scripts/**/*.ts',
        'src/components/**/*.tsx',
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
        'test-*.js',
      ],
      thresholds: {
        statements: 75, // Phase 0 baseline; will ratchet up
        branches: 65,
        functions: 75,
        lines: 75,
      }
    },
  },
});
