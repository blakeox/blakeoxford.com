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
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/__mocks__/**',
        'dist/**',
        '.astro/**',
        'public/**',
        'src/**/*.astro', // Exclude Astro components from coverage
        'src/pages/**', // Exclude Astro pages from coverage
        'src/layouts/**', // Exclude Astro layouts from coverage
        '**/debug-*.js', // Exclude debug files
        'test-*.js', // Exclude test utilities
        'scripts/**', // Exclude build scripts
        'playwright.config.ts',
        'vitest.config.ts',
        'astro.config.mjs',
        'tailwind.config.js',
        'postcss.config.cjs',
        'eslint.config.js',
      ],
      thresholds: {
        statements: 60, // Lowered for Astro project
        branches: 50,   // Lowered for Astro project
        functions: 60,  // Lowered for Astro project
        lines: 60,      // Lowered for Astro project
      }
    },
  },
});
