#!/usr/bin/env node

// Fallback test runner for when Playwright browsers can't be installed
// This generates basic test reports so CI artifacts can be created

const fs = require('fs');
const path = require('path');

// Create necessary directories
const testResultsDir = path.join(__dirname, 'test-results');
const playwrightReportDir = path.join(__dirname, 'playwright-report');

if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

if (!fs.existsSync(playwrightReportDir)) {
  fs.mkdirSync(playwrightReportDir, { recursive: true });
}

// Generate a basic JUnit XML report
const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Browser Installation Fallback" tests="1" failures="1" time="0">
    <testcase name="Browser Installation" classname="Playwright Setup">
      <failure type="BrowserInstallationError">
        Failed to install Playwright browsers. This is likely due to network connectivity issues.
        To fix this, ensure browsers are properly installed before running tests.
      </failure>
    </testcase>
  </testsuite>
</testsuites>`;

fs.writeFileSync(path.join(testResultsDir, 'junit.xml'), junitXml);

// Generate a basic HTML report
const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <title>Playwright Test Report - Browser Installation Failed</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 4px; }
    .info { color: #1976d2; background: #e3f2fd; padding: 20px; border-radius: 4px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Playwright Test Report</h1>
  <div class="error">
    <h2>❌ Browser Installation Failed</h2>
    <p>Tests could not run because Playwright browsers failed to install.</p>
    <p>This is typically caused by network connectivity issues during browser download.</p>
  </div>
  <div class="info">
    <h2>🔧 How to Fix</h2>
    <ul>
      <li>Run <code>npx playwright install</code> to install browsers</li>
      <li>Ensure network connectivity to Playwright CDN</li>
      <li>For CI environments, consider pre-installing browsers in Docker images</li>
    </ul>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(playwrightReportDir, 'index.html'), htmlReport);

console.log('✅ Created fallback test reports');
console.log(`📁 Test results: ${testResultsDir}`);
console.log(`📁 HTML report: ${playwrightReportDir}`);

process.exit(1); // Exit with error code to indicate tests failed