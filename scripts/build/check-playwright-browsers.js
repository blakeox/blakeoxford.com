#!/usr/bin/env node

/**
 * Check which Playwright browsers are available and suggest appropriate test commands
 */

import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkBrowserInstallation() {
  const browsers = ['chromium', 'firefox', 'webkit'];
  const installedBrowsers = [];
  const missingBrowsers = [];

  log(colors.blue, '🔍 Checking Playwright browser installations...\n');

  for (const browser of browsers) {
    try {
      // Try to check if browser is installed by running playwright with specific browser
      execSync('pnpm exec playwright --version > /dev/null 2>&1', { stdio: 'pipe' });
      
      // More specific check - try to get browser executable path
      try {
        const result = execSync(`pnpm exec playwright install --dry-run ${browser}`, { 
          stdio: 'pipe', 
          encoding: 'utf8' 
        });
        
        if (result.includes('is already installed') || result.includes('Skipping')) {
          installedBrowsers.push(browser);
          log(colors.green, `✅ ${browser.charAt(0).toUpperCase() + browser.slice(1)} is installed`);
        } else {
          missingBrowsers.push(browser);
          log(colors.yellow, `⚠️  ${browser.charAt(0).toUpperCase() + browser.slice(1)} is not installed`);
        }
      } catch {
        missingBrowsers.push(browser);
        log(colors.red, `❌ ${browser.charAt(0).toUpperCase() + browser.slice(1)} installation check failed`);
      }
    } catch {
      log(colors.red, '❌ Playwright is not properly installed');
      return { installedBrowsers: [], missingBrowsers: browsers, canRunTests: false };
    }
  }

  log(colors.blue, '\n📊 Summary:');
  log(colors.green, `   Installed: ${installedBrowsers.length} browsers (${installedBrowsers.join(', ')})`);
  if (missingBrowsers.length > 0) {
    log(colors.yellow, `   Missing: ${missingBrowsers.length} browsers (${missingBrowsers.join(', ')})`);
  }

  return {
    installedBrowsers,
    missingBrowsers,
    canRunTests: installedBrowsers.length > 0
  };
}

function suggestTestCommands(result) {
  log(colors.blue, '\n🎯 Suggested test commands:\n');

  if (result.canRunTests) {
    if (result.installedBrowsers.length === 3) {
      log(colors.green, '   All browsers available - run comprehensive tests:');
      log(colors.blue, '   pnpm test:e2e');
      log(colors.blue, '   COMPREHENSIVE_TESTS=true pnpm exec playwright test');
    } else if (result.installedBrowsers.includes('chromium')) {
      log(colors.yellow, '   Limited browsers available - run Chromium-only tests:');
      log(colors.blue, '   pnpm exec playwright test --project=chromium');
      log(colors.blue, '   pnpm test:e2e:essential');
    } else {
      log(colors.yellow, `   Run tests with available browser: ${result.installedBrowsers[0]}`);
      log(colors.blue, `   pnpm exec playwright test --project=${result.installedBrowsers[0]}`);
    }
  } else {
    log(colors.red, '   No browsers available - install browsers first:');
    log(colors.blue, '   pnpm exec playwright install --with-deps');
  }

  if (result.missingBrowsers.length > 0) {
    log(colors.yellow, '\n📦 To install missing browsers:');
    log(colors.blue, `   pnpm exec playwright install ${result.missingBrowsers.join(' ')} --with-deps`);
  }
}

function generateCIRecommendations(result) {
  log(colors.blue, '\n🔧 CI/CD Recommendations:\n');

  if (result.installedBrowsers.length < 3) {
    log(colors.yellow, '   For CI environments, consider this fallback strategy:');
    log(colors.blue, '   ```yaml');
    log(colors.blue, '   - name: Run E2E tests with fallback');
    log(colors.blue, '     run: |');
    log(colors.blue, '       if pnpm exec playwright test; then');
    log(colors.blue, '         echo "All tests passed"');
    log(colors.blue, '       else');
    log(colors.blue, '         echo "Falling back to Chromium only"');
    log(colors.blue, '         pnpm exec playwright test --project=chromium');
    log(colors.blue, '       fi');
    log(colors.blue, '   ```');
  }
}

function main() {
  try {
    log(colors.bold, '🎭 Playwright Browser Check Tool\n');

    const result = checkBrowserInstallation();
    suggestTestCommands(result);
    generateCIRecommendations(result);

    // Set exit code based on results
    if (!result.canRunTests) {
      log(colors.red, '\n❌ No browsers available for testing');
      process.exit(1);
    } else if (result.missingBrowsers.length > 0) {
      log(colors.yellow, '\n⚠️  Some browsers are missing, but tests can still run');
      process.exit(0);
    } else {
      log(colors.green, '\n✅ All browsers are available');
      process.exit(0);
    }
  } catch (error) {
    log(colors.red, `\n❌ Error checking browsers: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { checkBrowserInstallation, suggestTestCommands };
