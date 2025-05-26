import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80,
      }
    },
  },
});
