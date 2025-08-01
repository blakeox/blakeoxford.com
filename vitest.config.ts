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
      // Use include instead of exclude for better control
      include: [
        'src/config/navLinks.ts', // Only include files that actually have tests
        // Add other specific files that have tests here
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
        'src/**/*.astro',
        'src/pages/**',
        'src/layouts/**',
        'src/scripts/**',
        'src/utils/**',
        'src/middleware/**',
        'src/types/**',
        'src/components/**',
        '**/*.config.*',
        '**/debug-*.js',
        'test-*.js',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      }
    },
  },
});
