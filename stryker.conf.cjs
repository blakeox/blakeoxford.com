/**
 * Stryker Mutation Testing Configuration
 * Phase 6 initial integration (non-blocking)
 */
module.exports = {
  mutate: [
    'src/utils/**/*.ts',
    'src/config/**/*.ts',
    'tests/performance/perfBaselineHelper.ts',
    '!**/*.d.ts'
  ],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    coverageAnalysis: 'off' // rely on existing coverage run separately
  },
  reporters: ['progress', 'clear-text', ['html', { baseDir: 'mutation-report/html' }], ['json', { fileName: 'mutation-report/report.json' }]],
  tempDirName: '.stryker-tmp',
  concurrency: Math.max(1, (require('os').cpus().length || 2) - 1),
  timeoutMS: 6000,
  ignoreStatic: true,
  disableTypeChecks: true,
  thresholds: { high: 75, low: 60, break: 0 } // no break enforcement yet
};
