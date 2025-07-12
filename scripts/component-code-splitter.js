/**
 * Component-Level Code Splitting System
 * Intelligent lazy loading and bundle splitting for optimal performance
 */

import fs from 'fs/promises';
import path from 'path';

class ComponentCodeSplitter {
  constructor(options = {}) {
    this.componentsDir = options.componentsDir || './src/components';
    this.pagesDir = options.pagesDir || './src/pages';
    this.outputDir = options.outputDir || './code-splitting-analysis';
    this.chunkThreshold = options.chunkThreshold || 50000; // 50KB
    this.components = new Map();
    this.dependencies = new Map();
    this.chunks = new Map();
  }

  async analyzeAndSplit() {
    console.log('🎭 Starting component-level code splitting analysis...');

    await fs.mkdir(this.outputDir, { recursive: true });

    // Phase 1: Analyze component usage patterns
    await this.analyzeComponentUsage();

    // Phase 2: Create dependency graph
    await this.buildComponentGraph();

    // Phase 3: Identify splitting opportunities
    await this.identifySplittingOpportunities();

    // Phase 4: Generate lazy-loaded components
    await this.generateLazyComponents();

    // Phase 5: Create route-based chunks
    await this.createRouteChunks();

    // Phase 6: Generate optimization report
    await this.generateSplittingReport();

    console.log('✅ Component code splitting analysis completed!');
  }

  async analyzeComponentUsage() {
    console.log('📊 Analyzing component usage patterns...');

    const componentFiles = await this.getComponentFiles();
    const pageFiles = await this.getPageFiles();

    // Analyze each component
    for (const componentFile of componentFiles) {
      const analysis = await this.analyzeComponent(componentFile);
      this.components.set(componentFile, analysis);
    }

    // Analyze page usage
    for (const pageFile of pageFiles) {
      await this.analyzePageComponentUsage(pageFile);
    }
  }

  async getComponentFiles() {
    const files = [];
    try {
      const entries = await fs.readdir(this.componentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && /\.(astro|tsx?|jsx?)$/.test(entry.name)) {
          files.push(path.join(this.componentsDir, entry.name));
        }
      }
    } catch (error) {
      console.warn('⚠️ Components directory not found:', this.componentsDir);
    }
    return files;
  }

  async getPageFiles() {
    const files = [];
    try {
      const getAllFiles = async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...await getAllFiles(fullPath));
          } else if (/\.(astro|tsx?|jsx?)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      };
      await getAllFiles(this.pagesDir);
    } catch (error) {
      console.warn('⚠️ Pages directory not found:', this.pagesDir);
    }
    return files;
  }

  async analyzeComponent(componentFile) {
    const content = await fs.readFile(componentFile, 'utf8');
    const stats = await fs.stat(componentFile);

    const analysis = {
      name: path.basename(componentFile, path.extname(componentFile)),
      path: componentFile,
      size: stats.size,
      type: this.getComponentType(componentFile, content),
      complexity: this.calculateComplexity(content),
      dependencies: this.extractDependencies(content),
      usageCount: 0,
      isLazyLoadable: this.isLazyLoadable(content),
      renderTime: this.estimateRenderTime(content),
      priority: 'low'
    };

    return analysis;
  }

  getComponentType(filePath, content) {
    if (filePath.includes('Layout')) return 'layout';
    if (filePath.includes('Page')) return 'page';
    if (content.includes('useState') || content.includes('useEffect')) return 'interactive';
    if (content.includes('Chart') || content.includes('Graph')) return 'visualization';
    if (content.includes('Modal') || content.includes('Dialog')) return 'overlay';
    if (content.includes('Form')) return 'form';
    if (content.includes('Hero') || content.includes('Banner')) return 'hero';
    return 'ui';
  }

  calculateComplexity(content) {
    let complexity = 0;

    // Count various complexity indicators
    complexity += (content.match(/function|const.*=>/g) || []).length;
    complexity += (content.match(/useEffect|useState|useCallback/g) || []).length * 2;
    complexity += (content.match(/if|switch|for|while/g) || []).length;
    complexity += (content.match(/import.*from/g) || []).length * 0.5;

    return Math.round(complexity);
  }

  extractDependencies(content) {
    const dependencies = [];
    const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];

    importMatches.forEach(match => {
      const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
      if (moduleMatch) {
        dependencies.push(moduleMatch[1]);
      }
    });

    return dependencies;
  }

  isLazyLoadable(content) {
    // Components that should NOT be lazy loaded
    const criticalPatterns = [
      /Header|Nav|Footer/i,
      /Layout/i,
      /Critical|Above.*Fold/i,
      /Hero.*Section/i
    ];

    // Components that are GOOD for lazy loading
    const lazyPatterns = [
      /Modal|Dialog|Popup/i,
      /Chart|Graph|Visualization/i,
      /Gallery|Carousel/i,
      /Comment|Review/i,
      /Share|Social/i
    ];

    if (criticalPatterns.some(pattern => pattern.test(content))) {
      return false;
    }

    if (lazyPatterns.some(pattern => pattern.test(content))) {
      return true;
    }

    // Default: lazy loadable if complex enough
    return this.calculateComplexity(content) > 10;
  }

  estimateRenderTime(content) {
    let time = 1; // Base time in ms

    // Add time for various operations
    time += (content.match(/useEffect/g) || []).length * 2;
    time += (content.match(/fetch|axios|api/g) || []).length * 10;
    time += (content.match(/map|filter|reduce/g) || []).length * 0.5;
    time += content.length / 1000; // Rough estimate based on content size

    return Math.round(time);
  }

  async analyzePageComponentUsage(pageFile) {
    const content = await fs.readFile(pageFile, 'utf8');

    // Extract component imports and usage
    for (const [componentPath, component] of this.components) {
      const componentName = component.name;

      // Check if component is imported and used
      const importRegex = new RegExp(`import.*${componentName}.*from`, 'i');
      const usageRegex = new RegExp(`<${componentName}[\\s>]`, 'g');

      if (importRegex.test(content)) {
        const usageMatches = content.match(usageRegex) || [];
        component.usageCount += usageMatches.length;

        // Track which pages use this component
        if (!component.usedInPages) {
          component.usedInPages = [];
        }
        component.usedInPages.push(pageFile);
      }
    }
  }

  async buildComponentGraph() {
    console.log('🕸️ Building component dependency graph...');

    for (const [componentPath, component] of this.components) {
      const dependencies = [];

      for (const dep of component.dependencies) {
        if (dep.startsWith('./') || dep.startsWith('../')) {
          // Resolve relative path
          const resolvedPath = path.resolve(path.dirname(componentPath), dep);
          const componentDep = Array.from(this.components.keys())
            .find(cp => cp.startsWith(resolvedPath));

          if (componentDep) {
            dependencies.push(componentDep);
          }
        }
      }

      this.dependencies.set(componentPath, dependencies);
    }
  }

  async identifySplittingOpportunities() {
    console.log('🎯 Identifying code splitting opportunities...');

    for (const [componentPath, component] of this.components) {
      // Set priority based on usage and characteristics
      if (component.usageCount === 0) {
        component.priority = 'unused';
      } else if (component.type === 'hero' || component.type === 'layout') {
        component.priority = 'critical';
      } else if (component.isLazyLoadable && component.size > this.chunkThreshold) {
        component.priority = 'lazy-high';
      } else if (component.isLazyLoadable) {
        component.priority = 'lazy-medium';
      } else if (component.usageCount > 5) {
        component.priority = 'shared';
      } else {
        component.priority = 'standard';
      }

      // Identify chunk opportunities
      if (component.priority === 'lazy-high') {
        this.chunks.set(`lazy-${component.name}`, {
          type: 'lazy',
          components: [componentPath],
          size: component.size,
          reason: 'Large lazy-loadable component'
        });
      }
    }

    // Group related components into chunks
    await this.createFeatureChunks();
  }

  async createFeatureChunks() {
    const featureGroups = new Map();

    for (const [componentPath, component] of this.components) {
      if (component.priority !== 'critical' && component.priority !== 'unused') {
        const feature = this.identifyFeature(component);

        if (!featureGroups.has(feature)) {
          featureGroups.set(feature, []);
        }
        featureGroups.get(feature).push(componentPath);
      }
    }

    // Create chunks for feature groups
    for (const [feature, components] of featureGroups) {
      if (components.length > 1) {
        const totalSize = components.reduce((sum, cp) => {
          return sum + this.components.get(cp).size;
        }, 0);

        this.chunks.set(`feature-${feature}`, {
          type: 'feature',
          components: components,
          size: totalSize,
          reason: `Related ${feature} components`
        });
      }
    }
  }

  identifyFeature(component) {
    const name = component.name.toLowerCase();

    if (name.includes('blog') || name.includes('post')) return 'blog';
    if (name.includes('project') || name.includes('portfolio')) return 'projects';
    if (name.includes('contact') || name.includes('form')) return 'contact';
    if (name.includes('photo') || name.includes('image') || name.includes('gallery')) return 'media';
    if (name.includes('search') || name.includes('filter')) return 'search';
    if (name.includes('theme') || name.includes('toggle')) return 'theme';

    return 'ui';
  }

  async generateLazyComponents() {
    console.log('🔄 Generating lazy-loaded component wrappers...');

    const lazyDir = path.join(this.outputDir, 'lazy-components');
    await fs.mkdir(lazyDir, { recursive: true });

    for (const [componentPath, component] of this.components) {
      if (component.isLazyLoadable && component.priority !== 'critical') {
        const lazyWrapper = this.createLazyWrapper(component);
        const wrapperPath = path.join(lazyDir, `Lazy${component.name}.astro`);
        await fs.writeFile(wrapperPath, lazyWrapper);
      }
    }
  }

  createLazyWrapper(component) {
    const componentName = component.name;
    const relativePath = path.relative('./src/components', component.path);

    return `---
/**
 * Lazy-loaded wrapper for ${componentName}
 * Auto-generated by component-code-splitter.js
 */
import type { ComponentProps } from 'astro';

type Props = ComponentProps<typeof import('${relativePath}')['default']>;

const { ...props } = Astro.props;
---

<div data-lazy-component="${componentName}" data-intersection-observer>
  <div class="lazy-loading-placeholder">
    <div class="lazy-loading-spinner" aria-label="Loading ${componentName}">
      <div class="spinner"></div>
    </div>
  </div>
</div>

<script>
  // Intersection Observer for lazy loading
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        const componentName = target.dataset.lazyComponent;

        try {
          // Dynamic import of the actual component
          const { default: Component } = await import('${relativePath}');

          // Create the component instance (this would need framework-specific implementation)
          console.log(\`Loading \${componentName} component\`);

          // Replace placeholder with actual component
          // Note: This is a simplified example - actual implementation would depend on framework
          target.innerHTML = '<div>Component loaded!</div>';

        } catch (error) {
          console.error(\`Failed to load \${componentName}:\`, error);
          target.innerHTML = '<div>Failed to load component</div>';
        }

        observer.unobserve(target);
      }
    });
  }, { rootMargin: '50px' });

  // Observe all lazy components
  document.querySelectorAll('[data-lazy-component]').forEach(el => {
    observer.observe(el);
  });
</script>

<style>
  [data-lazy-component] {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lazy-loading-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .lazy-loading-spinner {
    display: inline-block;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(0,0,0,0.1);
    border-top: 3px solid var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>`;
  }

  async createRouteChunks() {
    console.log('🛣️ Creating route-based chunks...');

    const routeChunks = new Map();

    // Analyze pages and their component usage
    for (const [componentPath, component] of this.components) {
      if (component.usedInPages) {
        for (const pagePath of component.usedInPages) {
          const routeName = this.getRouteNameFromPath(pagePath);

          if (!routeChunks.has(routeName)) {
            routeChunks.set(routeName, {
              type: 'route',
              components: [],
              size: 0,
              reason: `Components used in ${routeName} route`
            });
          }

          const chunk = routeChunks.get(routeName);
          chunk.components.push(componentPath);
          chunk.size += component.size;
        }
      }
    }

    // Add route chunks to main chunks map
    for (const [routeName, chunk] of routeChunks) {
      this.chunks.set(`route-${routeName}`, chunk);
    }
  }

  getRouteNameFromPath(pagePath) {
    const relativePath = path.relative(this.pagesDir, pagePath);
    const routeName = relativePath
      .replace(/\.(astro|tsx?|jsx?)$/, '')
      .replace(/\[.*\]/g, 'dynamic')
      .replace(/\//g, '-')
      .replace(/^index$/, 'home');

    return routeName;
  }

  async generateSplittingReport() {
    console.log('📊 Generating code splitting report...');

    const totalComponents = this.components.size;
    const lazyComponents = Array.from(this.components.values())
      .filter(c => c.isLazyLoadable).length;
    const unusedComponents = Array.from(this.components.values())
      .filter(c => c.usageCount === 0).length;

    const totalSize = Array.from(this.components.values())
      .reduce((sum, c) => sum + c.size, 0);

    const report = {
      summary: {
        totalComponents,
        lazyComponents,
        unusedComponents,
        totalChunks: this.chunks.size,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
        potentialSavings: this.calculatePotentialSavings()
      },
      components: Object.fromEntries(
        Array.from(this.components.entries()).map(([path, comp]) => [
          path.replace(process.cwd(), '.'),
          {
            name: comp.name,
            size: `${(comp.size / 1024).toFixed(2)} KB`,
            type: comp.type,
            priority: comp.priority,
            usageCount: comp.usageCount,
            isLazyLoadable: comp.isLazyLoadable,
            complexity: comp.complexity
          }
        ])
      ),
      chunks: Object.fromEntries(
        Array.from(this.chunks.entries()).map(([name, chunk]) => [
          name,
          {
            type: chunk.type,
            componentCount: chunk.components.length,
            size: `${(chunk.size / 1024).toFixed(2)} KB`,
            reason: chunk.reason
          }
        ])
      ),
      recommendations: this.generateSplittingRecommendations()
    };

    await fs.writeFile(
      path.join(this.outputDir, 'code-splitting-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate markdown report
    const markdownReport = this.generateMarkdownSplittingReport(report);
    await fs.writeFile(
      path.join(this.outputDir, 'CODE_SPLITTING_REPORT.md'),
      markdownReport
    );

    console.log(`📋 Code splitting report saved to: ${this.outputDir}`);
    console.log(`💾 Total size: ${report.summary.totalSize}`);
    console.log(`🔄 Lazy loadable: ${lazyComponents}/${totalComponents} components`);
  }

  calculatePotentialSavings() {
    let savings = 0;

    for (const component of this.components.values()) {
      if (component.isLazyLoadable && component.priority !== 'critical') {
        savings += component.size;
      }
    }

    return `${(savings / 1024).toFixed(2)} KB`;
  }

  generateSplittingRecommendations() {
    const recommendations = [];

    const unusedCount = Array.from(this.components.values())
      .filter(c => c.usageCount === 0).length;

    if (unusedCount > 0) {
      recommendations.push(`Remove ${unusedCount} unused components to reduce bundle size`);
    }

    const lazyCount = Array.from(this.components.values())
      .filter(c => c.isLazyLoadable && c.priority !== 'critical').length;

    if (lazyCount > 0) {
      recommendations.push(`Implement lazy loading for ${lazyCount} components to improve initial load time`);
    }

    recommendations.push('Consider dynamic imports for route-specific components');
    recommendations.push('Group related components into feature-based chunks');
    recommendations.push('Use intersection observer for below-the-fold components');

    return recommendations;
  }

  generateMarkdownSplittingReport(report) {
    return `# Component Code Splitting Analysis

## Summary
- **Total Components**: ${report.summary.totalComponents}
- **Lazy Loadable**: ${report.summary.lazyComponents}
- **Unused Components**: ${report.summary.unusedComponents}
- **Total Chunks**: ${report.summary.totalChunks}
- **Total Size**: ${report.summary.totalSize}
- **Potential Savings**: ${report.summary.potentialSavings}

## Component Analysis

${Object.entries(report.components).map(([path, comp]) => `
### ${comp.name}
- **Path**: ${path}
- **Size**: ${comp.size}
- **Type**: ${comp.type}
- **Priority**: ${comp.priority}
- **Usage Count**: ${comp.usageCount}
- **Lazy Loadable**: ${comp.isLazyLoadable ? '✅' : '❌'}
- **Complexity**: ${comp.complexity}
`).join('\n')}

## Chunk Opportunities

${Object.entries(report.chunks).map(([name, chunk]) => `
### ${name}
- **Type**: ${chunk.type}
- **Components**: ${chunk.componentCount}
- **Size**: ${chunk.size}
- **Reason**: ${chunk.reason}
`).join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const splitter = new ComponentCodeSplitter();
  splitter.analyzeAndSplit().catch(error => {
    console.error('Component code splitting failed:', error);
    process.exit(1);
  });
}

export default ComponentCodeSplitter;
