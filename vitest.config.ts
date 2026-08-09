import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^astro:content$/,
        replacement: path.resolve(__dirname, 'tests/__mocks__/astro-content.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
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
    reporters: process.env.CI ? ['default', './tests/reporters/flakinessReporter.ts'] : ['default'],
    // Vitest 4: pool options are top-level (singleFork avoids worker IPC hangs in some environments)
    pool: 'forks',
    fileParallelism: false,
    singleFork: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Measure the tested production contracts, including Worker routes. The
      // full browser/UI surface is covered by Playwright rather than silently
      // excluded from the release signal.
      all: false,
      include: [
        'src/config/navLinks.ts',
        'src/config/navSearchPages.ts',
        'src/lib/theme.ts',
        'src/features/chat/components/MessageActions.tsx',
        'src/features/chat/components/MessageCTAs.tsx',
        'src/features/chat/components/MessageContent.tsx',
        'src/features/chat/components/MessageSources.tsx',
        'functions/routes/ai-search/types.ts',
        'functions/routes/conversation.ts',
        'functions/ConversationDO.ts',
        'functions/shared/cors.ts',
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
