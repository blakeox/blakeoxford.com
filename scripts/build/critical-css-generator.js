/**
 * Per-Page Critical CSS Generator
 * Automatically generates and inlines critical CSS for each page type
 */

import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

class CriticalCSSGenerator {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4321';
    this.outputDir = options.outputDir || './src/styles/critical';
    this.viewports = options.viewports || [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' }
    ];
    this.pages = options.pages || [
      { url: '/', name: 'home' },
      { url: '/about', name: 'about' },
      { url: '/projects', name: 'projects' },
      { url: '/blog', name: 'blog' },
      { url: '/contact', name: 'contact' }
    ];
  }

  async generateAllCriticalCSS() {
    console.log('🎨 Starting per-page critical CSS generation...');

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      for (const page of this.pages) {
        console.log(`\n📄 Processing: ${page.name} (${page.url})`);

        const criticalCSS = await this.generatePageCriticalCSS(browser, page);
        await this.saveCriticalCSS(page.name, criticalCSS);

        // Generate responsive variants
        for (const viewport of this.viewports) {
          const responsiveCSS = await this.generateResponsiveCriticalCSS(browser, page, viewport);
          await this.saveCriticalCSS(`${page.name}-${viewport.name}`, responsiveCSS);
        }
      }

      // Generate master critical CSS file
      await this.generateMasterCriticalCSS();

      console.log('\n✅ Critical CSS generation completed!');

    } finally {
      await browser.close();
    }
  }

  async generatePageCriticalCSS(browser, pageConfig) {
    const page = await browser.newPage();

    try {
      // Set viewport to desktop by default
      await page.setViewport({ width: 1440, height: 900 });

      // Navigate to page
      await page.goto(`${this.baseUrl}${pageConfig.url}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Extract critical CSS using Puppeteer's coverage API
      await page.coverage.startCSSCoverage();

      // Scroll to trigger any lazy-loaded content
      await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0); // Reset to top
              setTimeout(resolve, 500);
            }
          }, 100);
        });
      });

      // Get CSS coverage
      const cssCoverage = await page.coverage.stopCSSCoverage();

      // Extract critical CSS (above-the-fold)
      const criticalCSS = await this.extractCriticalRules(page, cssCoverage);

      return criticalCSS;

    } finally {
      await page.close();
    }
  }

  async generateResponsiveCriticalCSS(browser, pageConfig, viewport) {
    const page = await browser.newPage();

    try {
      await page.setViewport(viewport);

      await page.goto(`${this.baseUrl}${pageConfig.url}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Get above-the-fold elements
      const aboveFoldElements = await page.evaluate((vh) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.top < vh && rect.bottom > 0;
          })
          .map(el => ({
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id
          }));
      }, viewport.height);

      // Extract critical styles for these elements
      const criticalCSS = await this.extractElementStyles(page, aboveFoldElements);

      return criticalCSS;

    } finally {
      await page.close();
    }
  }

  async extractCriticalRules(page, cssCoverage) {
    const usedCSS = [];

    for (const coverage of cssCoverage) {
      const cssText = coverage.text;
      const usedBytes = coverage.ranges
        .filter(range => range.start < 50000) // Focus on early CSS
        .map(range => cssText.slice(range.start, range.end))
        .join('');

      if (usedBytes) {
        usedCSS.push(usedBytes);
      }
    }

    // Parse and minify critical CSS
    const criticalCSS = usedCSS.join('');
    return this.minifyCSS(criticalCSS);
  }

  async extractElementStyles(page, elements) {
    const styles = await page.evaluate((elementList) => {
      const criticalStyles = [];

      elementList.forEach(elementInfo => {
        // Find matching elements
        let selector = elementInfo.tagName;
        if (elementInfo.id) selector += `#${elementInfo.id}`;
        if (elementInfo.className) {
          const classes = elementInfo.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }

        // Get computed styles for critical properties
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const computed = window.getComputedStyle(el);
          const criticalProps = [
            'display', 'position', 'top', 'left', 'right', 'bottom',
            'width', 'height', 'margin', 'padding', 'border',
            'background', 'color', 'font-family', 'font-size',
            'font-weight', 'line-height', 'text-align'
          ];

          const styles = {};
          criticalProps.forEach(prop => {
            const value = computed.getPropertyValue(prop);
            if (value && value !== 'auto' && value !== 'normal') {
              styles[prop] = value;
            }
          });

          if (Object.keys(styles).length > 0) {
            criticalStyles.push({ selector, styles });
          }
        });
      });

      return criticalStyles;
    }, elements);

    // Convert to CSS string
    return this.stylesToCSS(styles);
  }

  stylesToCSS(styleObjects) {
    return styleObjects
      .map(({ selector, styles }) => {
        const cssProps = Object.entries(styles)
          .map(([prop, value]) => `  ${prop}: ${value};`)
          .join('\n');
        return `${selector} {\n${cssProps}\n}`;
      })
      .join('\n\n');
  }

  minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon
      .replace(/\s*{\s*/g, '{') // Clean braces
      .replace(/;\s*/g, ';') // Clean semicolons
      .trim();
  }

  async saveCriticalCSS(pageName, css) {
    const filePath = path.join(this.outputDir, `${pageName}.css`);
    await fs.writeFile(filePath, css);

    console.log(`   ✓ Saved critical CSS: ${filePath} (${css.length} bytes)`);
  }

  async generateMasterCriticalCSS() {
    console.log('\n📋 Generating master critical CSS file...');

    // Read all generated critical CSS files
    const files = await fs.readdir(this.outputDir);
    const cssFiles = files.filter(f => f.endsWith('.css'));

    const masterCSS = {
      common: '',
      pages: {}
    };

    // Find common styles across all pages
    const allCSS = [];
    for (const file of cssFiles) {
      const content = await fs.readFile(path.join(this.outputDir, file), 'utf8');
      const pageName = file.replace('.css', '');
      allCSS.push({ pageName, content });
    }

    // Extract common styles (simplified approach)
    const commonRules = this.extractCommonRules(allCSS);
    masterCSS.common = commonRules;

    // Store page-specific styles
    allCSS.forEach(({ pageName, content }) => {
      if (!pageName.includes('-')) { // Exclude responsive variants for now
        masterCSS.pages[pageName] = content.replace(commonRules, '').trim();
      }
    });

    // Generate TypeScript interface for critical CSS
    await this.generateCriticalCSSInterface(masterCSS);

    // Save master file
    const masterPath = path.join(this.outputDir, 'master.json');
    await fs.writeFile(masterPath, JSON.stringify(masterCSS, null, 2));

    console.log(`✓ Master critical CSS saved: ${masterPath}`);
  }

  extractCommonRules(allCSS) {
    // Simple implementation - find rules that appear in all files
    const ruleCounts = new Map();

    allCSS.forEach(({ content }) => {
      const rules = content.split('}').filter(rule => rule.trim());
      rules.forEach(rule => {
        const cleanRule = rule.trim() + '}';
        ruleCounts.set(cleanRule, (ruleCounts.get(cleanRule) || 0) + 1);
      });
    });

    // Return rules that appear in most files
    const threshold = Math.ceil(allCSS.length * 0.7); // 70% threshold
    const commonRules = [];

    ruleCounts.forEach((count, rule) => {
      if (count >= threshold) {
        commonRules.push(rule);
      }
    });

    return commonRules.join('\n');
  }

  async generateCriticalCSSInterface(masterCSS) {
    const interfaceContent = `
/**
 * Critical CSS Interface
 * Auto-generated by critical-css-generator.js
 */

export interface CriticalCSSMap {
  common: string;
  pages: {
    ${Object.keys(masterCSS.pages).map(page => `${page}: string;`).join('\n    ')}
  };
}

export const criticalCSS: CriticalCSSMap = ${JSON.stringify(masterCSS, null, 2)};

export function getCriticalCSS(pageName: string): string {
  const pageCSS = criticalCSS.pages[pageName as keyof typeof criticalCSS.pages] || '';
  return criticalCSS.common + '\\n' + pageCSS;
}
`;

    const interfacePath = path.join(this.outputDir, 'critical-css.ts');
    await fs.writeFile(interfacePath, interfaceContent);

    console.log(`✓ TypeScript interface generated: ${interfacePath}`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new CriticalCSSGenerator({
    baseUrl: process.env.BASE_URL || 'http://localhost:4321'
  });

  generator.generateAllCriticalCSS().catch(error => {
    console.error('Critical CSS generation failed:', error);
    process.exit(1);
  });
}

export default CriticalCSSGenerator;
