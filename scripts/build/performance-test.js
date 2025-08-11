/**
 * Automated Performance Testing Script
 * Lighthouse CI integration with custom performance budgets
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import http from 'http';

class PerformanceTestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.BASE_URL || 'http://localhost:4321';
    this.outputDir = options.outputDir || './lighthouse-reports';
    this.budgets = this.normalizeBudgets(options.budgets || this.getDefaultBudgets());
    this.thresholds = options.thresholds || this.getDefaultThresholds();
    this.serverProcess = null;
    this.isExternalServer = !!process.env.BASE_URL;
  }

  // Map human-friendly or variant keys to Lighthouse category ids
  normalizeCategoryKey(key) {
    if (!key) return key;
    const lower = String(key).toLowerCase();
    switch (lower) {
      case 'bestpractices':
      case 'best_practices':
      case 'best-practices':
        return 'best-practices';
      case 'a11y':
        return 'accessibility';
      default:
        return lower; // performance, accessibility, seo
    }
  }

  normalizeBudgets(budgets) {
    const normalized = {};
    Object.entries(budgets || {}).forEach(([k, v]) => {
      normalized[this.normalizeCategoryKey(k)] = v;
    });
    return normalized;
  }

  getDefaultBudgets() {
    return {
      performance: 95,
  accessibility: 99,
      // Use Lighthouse category id "best-practices" (kebab-case)
  'best-practices': 90,
      seo: 95
    };
  }

  getDefaultThresholds() {
    return {
      // Core Web Vitals
      'largest-contentful-paint': 2500,
      'max-potential-fid': 100, // FID equivalent
      'cumulative-layout-shift': 0.1,

      // Other key metrics
      'first-contentful-paint': 1800,
      'speed-index': 3000,
      'interactive': 3800, // TTI
      'total-blocking-time': 200,

      // Resource budgets
      'total-byte-weight': 512000, // 512KB
      'dom-size': 1500,
      'unused-javascript': 51200, // 50KB unused JS
      'render-blocking-resources': 0
    };
  }

  getLighthouseConfig() {
    return {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      }
      // Removed custom audits array - using default Lighthouse audits
    };
  }

  async waitForServer(url, maxRetries = 30, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise((resolve, reject) => {
          const request = http.get(url, (response) => {
            if (response.statusCode >= 200 && response.statusCode < 400) {
              resolve();
            } else {
              reject(new Error(`Server returned ${response.statusCode}`));
            }
          });
          request.on('error', reject);
          request.setTimeout(2000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
          });
        });
        
        console.log('✅ Server is ready');
        return true;
      } catch {
        // Server not ready yet
      }
      
      console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error(`Server at ${url} did not become ready within ${maxRetries * delay / 1000} seconds`);
  }

  async startDevServer() {
    if (this.isExternalServer) {
      console.log(`🌐 Using external server: ${this.baseUrl}`);
      await this.waitForServer(this.baseUrl);
      return;
    }

    console.log('🚀 Starting local static server (serving dist)...');
    // Use a lightweight static server to avoid nested child processes from astro preview
    // Requires devDependency "serve" (present in this repo)
    this.serverProcess = spawn(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['exec', 'serve', '-s', 'dist', '-l', '4321'],
      {
        detached: true, // start in its own process group
        stdio: 'ignore', // prevent stdio pipes from keeping this process alive
        env: { ...process.env },
      }
    );
    // Detach so our process can exit independently
    this.serverProcess.unref?.();

    // Wait for server to be ready
    await this.waitForServer(this.baseUrl);
  }

  async stopDevServer() {
    if (this.serverProcess && !this.isExternalServer) {
      console.log('🛑 Stopping dev server...');
      try {
        if (process.platform === 'win32') {
          // Force kill the process tree on Windows
          spawn('taskkill', ['/pid', String(this.serverProcess.pid), '/t', '/f'], { stdio: 'ignore' });
        } else {
          // Kill the entire process group we created with detached: true
          try {
            process.kill(-this.serverProcess.pid, 'SIGTERM');
          } catch {
            // If group kill fails (e.g., already exited), ignore
          }
        }
      } finally {
        // Best-effort small delay to let the OS reap the process
        await new Promise((r) => setTimeout(r, 200));
        this.serverProcess = null;
      }
    }
  }

  async runTests() {
    console.log('🚀 Starting performance test suite...');

    try {
      // Start dev server if needed
      await this.startDevServer();

      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      const testPages = [
        { url: `${this.baseUrl}/`, name: 'homepage' },
        { url: `${this.baseUrl}/about`, name: 'about' },
        { url: `${this.baseUrl}/projects`, name: 'projects' },
        { url: `${this.baseUrl}/blog`, name: 'blog' },
        { url: `${this.baseUrl}/contact`, name: 'contact' }
      ];

      const results = [];

      for (const page of testPages) {
        console.log(`\n📊 Testing: ${page.name} (${page.url})`);

        try {
          const result = await this.runLighthouseTest(page);
          results.push(result);

          // Generate individual report
          await this.generateReport(result, page.name);

          // Check budgets
          this.checkBudgets(result, page.name);

        } catch (error) {
          console.error(`❌ Failed to test ${page.name}:`, error.message);
          results.push({ page: page.name, error: error.message });
        }
      }

      // Generate summary report
      await this.generateSummaryReport(results);

      console.log('\n✅ Performance testing completed!');
      return results;

    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      throw error;
    } finally {
      // Always stop the dev server
      await this.stopDevServer();
    }
  }

  async runLighthouseTest(page) {
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const options = {
        logLevel: 'info',
        output: 'json',
        // Exclude PWA category by default; CI often disables SW to avoid flakiness
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port
      };

      const config = this.getLighthouseConfig();
      const runnerResult = await lighthouse(page.url, options, config);

      return {
        page: page.name,
        url: page.url,
        scores: runnerResult.lhr.categories,
        audits: runnerResult.lhr.audits,
        timing: runnerResult.lhr.timing,
        report: runnerResult.report
      };

    } finally {
      await chrome.kill();
    }
  }

  checkBudgets(result, pageName) {
    const scores = result.scores;
    let budgetPassed = true;
    const failures = [];

    // Check category scores
    Object.entries(this.budgets).forEach(([category, threshold]) => {
      const catKey = this.normalizeCategoryKey(category);
      const scoreRaw = scores[catKey]?.score;
      const score = typeof scoreRaw === 'number' ? scoreRaw * 100 : 0;
      if (score < threshold) {
        budgetPassed = false;
        failures.push(`${catKey}: ${score.toFixed(1)} < ${threshold}`);
      }
    });

    // Check metric thresholds
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const audit = result.audits[metric];
      if (audit && audit.numericValue > threshold) {
        budgetPassed = false;
        failures.push(`${metric}: ${audit.numericValue.toFixed(1)} > ${threshold}`);
      }
    });

    if (budgetPassed) {
      console.log(`✅ ${pageName}: All budgets passed`);
    } else {
      console.log(`❌ ${pageName}: Budget failures:`);
      failures.forEach(failure => console.log(`   - ${failure}`));
    }

    return { passed: budgetPassed, failures };
  }

  async generateReport(result, pageName) {
    const reportPath = path.join(this.outputDir, `${pageName}-report.json`);
    const htmlPath = path.join(this.outputDir, `${pageName}-report.html`);

    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2));

    // Save HTML report
    await fs.writeFile(htmlPath, result.report);

    console.log(`📋 Report saved: ${reportPath}`);
  }

  async generateSummaryReport(results) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalPages: results.length,
      passed: 0,
      failed: 0,
      results: results.map(result => {
        if (result.error) {
          return { page: result.page, status: 'error', error: result.error };
        }

        const budgetCheck = this.checkBudgets(result, result.page);
        const status = budgetCheck.passed ? 'passed' : 'failed';

        return {
          page: result.page,
          status,
          scores: Object.fromEntries(
            Object.entries(result.scores).map(([key, cat]) => [key, cat.score * 100])
          ),
          coreWebVitals: {
            LCP: result.audits['largest-contentful-paint']?.numericValue,
            FID: result.audits['max-potential-fid']?.numericValue, // FID is not directly available in Lighthouse
            CLS: result.audits['cumulative-layout-shift']?.numericValue
          },
          budgetFailures: budgetCheck.failures
        };
      })
    };

    // Compute pass/fail counts based on mapped results
    summary.passed = summary.results.filter(r => r.status === 'passed').length;
    summary.failed = summary.results.filter(r => r.status === 'failed').length;

    const summaryPath = path.join(this.outputDir, 'summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(summary);
    const markdownPath = path.join(this.outputDir, 'PERFORMANCE_REPORT.md');
    await fs.writeFile(markdownPath, markdownSummary);

    console.log(`📊 Summary report: ${summaryPath}`);
    console.log(`📝 Markdown report: ${markdownPath}`);

    return summary;
  }

  generateMarkdownSummary(summary) {
    let markdown = '# Performance Test Report\n\n';
    markdown += `**Generated:** ${summary.timestamp}\n`;
    markdown += `**Pages Tested:** ${summary.totalPages}\n`;
    markdown += `**Passed:** ${summary.passed}\n`;
    markdown += `**Failed:** ${summary.failed}\n\n`;

    markdown += '## Results by Page\n\n';

    summary.results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      markdown += `### ${status} ${result.page}\n\n`;

      if (result.error) {
        markdown += `**Error:** ${result.error}\n\n`;
        return;
      }

      markdown += '| Category | Score |\n';
      markdown += '|----------|-------|\n';
      Object.entries(result.scores).forEach(([category, score]) => {
        markdown += `| ${category} | ${score.toFixed(1)} |\n`;
      });
      markdown += '\n';

      markdown += '**Core Web Vitals:**\n';
      markdown += `- LCP: ${result.coreWebVitals.LCP?.toFixed(1) || 'N/A'}ms\n`;
      markdown += `- FID: ${result.coreWebVitals.FID?.toFixed(1) || 'N/A'}ms\n`;
      markdown += `- CLS: ${result.coreWebVitals.CLS?.toFixed(3) || 'N/A'}\n\n`;

      if (result.budgetFailures?.length > 0) {
        markdown += '**Budget Failures:**\n';
        result.budgetFailures.forEach(failure => {
          markdown += `- ${failure}\n`;
        });
        markdown += '\n';
      }
    });

    return markdown;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new PerformanceTestRunner({
    baseUrl: process.env.BASE_URL || 'http://localhost:4321',
    outputDir: process.env.OUTPUT_DIR || './lighthouse-reports'
  });

  runner.runTests().catch(error => {
    console.error('Performance testing failed:', error);
    process.exit(1);
  });
}

export default PerformanceTestRunner;
