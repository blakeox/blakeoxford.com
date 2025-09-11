/**
 * Stryker Mutation Testing Configuration
 * Phase 6 initial setup: narrow scope, reporting only (no gating yet).
 */

export default {
  mutate: [
    // Targeted core logic paths (adjust as needed)
    'src/utils/**/*.ts',
    'scripts/content/**/*.js',
    'tests/performance/perfBaselineHelper.ts',
    '!**/*.d.ts'
  ],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    enableFindRelatedTests: true
  },
  reporters: [ 'progress', 'clear-text', 'html', 'json' ],
  htmlReporter: { baseDir: 'mutation-report' },
  jsonReporter: { fileName: 'mutation-report/report.json' },
  tempDirName: '.stryker-tmp',
  coverageAnalysis: 'perTest',
  timeoutMS: 6000,
  checkers: ['typescript'],
  thresholds: { high: 75, low: 60, break: null },
  ignorePatterns: [ 'dist', 'public', 'node_modules', 'tests/playwright' ],
  concurrency: 0 // let Stryker decide based on CPUs
};
