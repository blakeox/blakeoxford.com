/**
 * Advanced Tree Shaking & Dead Code Elimination System
 * Analyzes and removes unused code with surgical precision
 */

import fs from 'fs/promises';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

class AdvancedTreeShaker {
  constructor(options = {}) {
    this.srcDir = options.srcDir || './src';
    this.publicDir = options.publicDir || './public';
    this.outputDir = options.outputDir || './tree-shaking-analysis';
    this.usageMap = new Map();
    this.exportMap = new Map();
    this.importMap = new Map();
    this.deadCode = new Map();
    this.sideEffects = new Set();
  }

  async analyzeProject() {
    console.log('🔍 Starting advanced tree shaking analysis...');

    await fs.mkdir(this.outputDir, { recursive: true });

    // Phase 1: Discover all files and their exports/imports
    await this.discoverCodeStructure();

    // Phase 2: Build dependency graph
    await this.buildDependencyGraph();

    // Phase 3: Mark used code starting from entry points
    await this.markUsedCode();

    // Phase 4: Identify dead code
    await this.identifyDeadCode();

    // Phase 5: Generate optimized bundles
    await this.generateOptimizedCode();

    // Phase 6: Create tree shaking report
    await this.generateReport();

    console.log('✅ Tree shaking analysis completed!');
  }

  async discoverCodeStructure() {
    console.log('📂 Discovering code structure...');

    const files = await this.getAllFiles(this.srcDir);

    for (const file of files) {
      if (this.isJavaScriptFile(file)) {
        await this.analyzeFile(file);
      }
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  isJavaScriptFile(file) {
    return /\.(js|ts|jsx|tsx|astro)$/.test(file);
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const ast = this.parseCode(content, filePath);

      const fileAnalysis = {
        exports: new Set(),
        imports: new Map(),
        functions: new Set(),
        variables: new Set(),
        classes: new Set(),
        usedIdentifiers: new Set(),
        sideEffects: false
      };

      traverse.default(ast, {
        // Track exports
        ExportNamedDeclaration: (nodePath) => {
          if (nodePath.node.declaration) {
            this.extractExportedIdentifiers(nodePath.node.declaration, fileAnalysis.exports);
          }
          if (nodePath.node.specifiers) {
            nodePath.node.specifiers.forEach(spec => {
              fileAnalysis.exports.add(spec.exported.name);
            });
          }
        },

        ExportDefaultDeclaration: () => {
          fileAnalysis.exports.add('default');
        },

        // Track imports
        ImportDeclaration: (nodePath) => {
          const source = nodePath.node.source.value;
          const imports = [];

          nodePath.node.specifiers.forEach(spec => {
            if (spec.type === 'ImportDefaultSpecifier') {
              imports.push({ name: 'default', local: spec.local.name });
            } else if (spec.type === 'ImportSpecifier') {
              imports.push({
                name: spec.imported.name,
                local: spec.local.name
              });
            } else if (spec.type === 'ImportNamespaceSpecifier') {
              imports.push({ name: '*', local: spec.local.name });
            }
          });

          fileAnalysis.imports.set(source, imports);
        },

        // Track function declarations
        FunctionDeclaration: (nodePath) => {
          if (nodePath.node.id) {
            fileAnalysis.functions.add(nodePath.node.id.name);
          }
        },

        // Track variable declarations
        VariableDeclarator: (nodePath) => {
          if (nodePath.node.id.type === 'Identifier') {
            fileAnalysis.variables.add(nodePath.node.id.name);
          }
        },

        // Track class declarations
        ClassDeclaration: (nodePath) => {
          if (nodePath.node.id) {
            fileAnalysis.classes.add(nodePath.node.id.name);
          }
        },

        // Track identifier usage
        Identifier: (nodePath) => {
          if (nodePath.isReferencedIdentifier()) {
            fileAnalysis.usedIdentifiers.add(nodePath.node.name);
          }
        },

        // Detect side effects
        CallExpression: (nodePath) => {
          // Check for side-effect patterns
          if (this.hasSideEffects(nodePath.node)) {
            fileAnalysis.sideEffects = true;
            this.sideEffects.add(filePath);
          }
        }
      });

      this.exportMap.set(filePath, fileAnalysis.exports);
      this.importMap.set(filePath, fileAnalysis.imports);
      this.usageMap.set(filePath, fileAnalysis);

    } catch (error) {
      console.warn(`⚠️ Failed to analyze ${filePath}:`, error.message);
    }
  }

  parseCode(content, filePath) {
    const isAstro = /\.astro$/.test(filePath);

    // Extract JavaScript from Astro files
    if (isAstro) {
      const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      content = scriptMatch ? scriptMatch[1] : '';
    }

    return parse(content, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport'
      ]
    });
  }

  extractExportedIdentifiers(declaration, exports) {
    if (declaration.type === 'FunctionDeclaration' && declaration.id) {
      exports.add(declaration.id.name);
    } else if (declaration.type === 'VariableDeclaration') {
      declaration.declarations.forEach(decl => {
        if (decl.id.type === 'Identifier') {
          exports.add(decl.id.name);
        }
      });
    } else if (declaration.type === 'ClassDeclaration' && declaration.id) {
      exports.add(declaration.id.name);
    }
  }

  hasSideEffects(callExpression) {
    const callee = callExpression.callee;

    // Common side-effect patterns
    const sideEffectPatterns = [
      'console.log',
      'console.warn',
      'console.error',
      'document.write',
      'localStorage.setItem',
      'sessionStorage.setItem',
      'fetch',
      'XMLHttpRequest',
      'addEventListener',
      'removeEventListener'
    ];

    if (callee.type === 'MemberExpression') {
      const objectName = callee.object.name;
      const propertyName = callee.property.name;
      const fullName = `${objectName}.${propertyName}`;

      return sideEffectPatterns.includes(fullName);
    }

    return false;
  }

  async buildDependencyGraph() {
    console.log('🕸️ Building dependency graph...');

    this.dependencyGraph = new Map();

    for (const [filePath, imports] of this.importMap) {
      const dependencies = new Set();

      for (const [importPath] of imports) {
        const resolvedPath = await this.resolveImportPath(importPath, filePath);
        if (resolvedPath) {
          dependencies.add(resolvedPath);
        }
      }

      this.dependencyGraph.set(filePath, dependencies);
    }
  }

  async resolveImportPath(importPath, fromFile) {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolved = path.resolve(path.dirname(fromFile), importPath);

      // Try different extensions
      const extensions = ['.js', '.ts', '.jsx', '.tsx', '.astro'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        try {
          await fs.access(withExt);
          return withExt;
        } catch {
          // File doesn't exist with this extension, try next
        }
      }
    }

    // Handle absolute imports from src
    if (!importPath.startsWith('.')) {
      const srcPath = path.join(this.srcDir, importPath);
      try {
        await fs.access(srcPath);
        return srcPath;
      } catch {
        // Path doesn't exist in src directory
      }
    }

    return null; // External dependency
  }

  async markUsedCode() {
    console.log('✅ Marking used code from entry points...');

    const entryPoints = await this.findEntryPoints();
    const visited = new Set();

    for (const entryPoint of entryPoints) {
      await this.markFileAsUsed(entryPoint, visited);
    }
  }

  async findEntryPoints() {
    // Common entry points in Astro projects
    const entryPoints = [
      path.join(this.srcDir, 'pages'),
      path.join(this.srcDir, 'layouts'),
      path.join(this.srcDir, 'components')
    ];

    const entryFiles = [];

    for (const entryDir of entryPoints) {
      try {
        const files = await this.getAllFiles(entryDir);
        entryFiles.push(...files.filter(f => this.isJavaScriptFile(f)));
      } catch {
        // Directory doesn't exist
      }
    }

    return entryFiles;
  }

  async markFileAsUsed(filePath, visited) {
    if (visited.has(filePath)) return;
    visited.add(filePath);

    const dependencies = this.dependencyGraph.get(filePath) || new Set();

    for (const dependency of dependencies) {
      await this.markFileAsUsed(dependency, visited);
    }

    // Mark all exports from this file as potentially used
    const analysis = this.usageMap.get(filePath);
    if (analysis) {
      analysis.isUsed = true;
    }
  }

  async identifyDeadCode() {
    console.log('💀 Identifying dead code...');

    for (const [filePath, analysis] of this.usageMap) {
      if (!analysis.isUsed && !this.sideEffects.has(filePath)) {
        this.deadCode.set(filePath, {
          type: 'entire-file',
          reason: 'File not imported by any entry point',
          size: await this.getFileSize(filePath)
        });
      } else {
        // Check for unused exports within used files
        const unusedExports = await this.findUnusedExports(filePath, analysis);
        if (unusedExports.size > 0) {
          this.deadCode.set(filePath, {
            type: 'unused-exports',
            exports: Array.from(unusedExports),
            reason: 'Exports not imported by any file'
          });
        }
      }
    }
  }

  async findUnusedExports(filePath, analysis) {
    const unusedExports = new Set(analysis.exports);

    // Check all files that import from this file
    for (const [importerPath, imports] of this.importMap) {
      for (const [importPath, importedItems] of imports) {
        const resolvedPath = await this.resolveImportPath(importPath, importerPath);
        if (resolvedPath === filePath) {
          importedItems.forEach(item => {
            unusedExports.delete(item.name);
          });
        }
      }
    }

    return unusedExports;
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  async generateOptimizedCode() {
    console.log('🛠️ Generating optimized code...');

    const optimizedDir = path.join(this.outputDir, 'optimized');
    await fs.mkdir(optimizedDir, { recursive: true });

    for (const [filePath, analysis] of this.usageMap) {
      if (analysis.isUsed) {
        const deadInfo = this.deadCode.get(filePath);

        if (deadInfo && deadInfo.type === 'unused-exports') {
          // Remove unused exports
          const optimizedContent = await this.removeUnusedExports(filePath, deadInfo.exports);
          const relativePath = path.relative(this.srcDir, filePath);
          const outputPath = path.join(optimizedDir, relativePath);

          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, optimizedContent);
        }
      }
    }
  }

  async removeUnusedExports(filePath, unusedExports) {
    const content = await fs.readFile(filePath, 'utf8');
    const ast = this.parseCode(content, filePath);

    traverse.default(ast, {
      ExportNamedDeclaration: (nodePath) => {
        if (nodePath.node.specifiers) {
          nodePath.node.specifiers = nodePath.node.specifiers.filter(spec => {
            return !unusedExports.includes(spec.exported.name);
          });

          if (nodePath.node.specifiers.length === 0) {
            nodePath.remove();
          }
        }
      }
    });

    return generate.default(ast).code;
  }

  async generateReport() {
    console.log('📊 Generating tree shaking report...');

    const totalFiles = this.usageMap.size;
    const deadFiles = Array.from(this.deadCode.values()).filter(d => d.type === 'entire-file').length;
    const filesWithUnusedExports = Array.from(this.deadCode.values()).filter(d => d.type === 'unused-exports').length;

    let totalDeadSize = 0;
    for (const [, deadInfo] of this.deadCode) {
      if (deadInfo.type === 'entire-file') {
        totalDeadSize += deadInfo.size;
      }
    }

    const report = {
      summary: {
        totalFiles,
        deadFiles,
        filesWithUnusedExports,
        totalDeadSize,
        potentialSavings: `${(totalDeadSize / 1024).toFixed(2)} KB`
      },
      deadCode: Object.fromEntries(this.deadCode),
      sideEffects: Array.from(this.sideEffects),
      recommendations: this.generateRecommendations()
    };

    await fs.writeFile(
      path.join(this.outputDir, 'tree-shaking-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    await fs.writeFile(
      path.join(this.outputDir, 'TREE_SHAKING_REPORT.md'),
      markdownReport
    );

    console.log(`📋 Tree shaking report saved to: ${this.outputDir}`);
    console.log(`💾 Potential savings: ${report.summary.potentialSavings}`);
    console.log(`🗑️ Dead files: ${deadFiles}/${totalFiles}`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.deadCode.size > 0) {
      recommendations.push('Remove identified dead code files to reduce bundle size');
    }

    if (this.sideEffects.size > 0) {
      recommendations.push('Review files with side effects for optimization opportunities');
    }

    recommendations.push('Consider dynamic imports for large components');
    recommendations.push('Implement barrel exports carefully to avoid importing unused code');
    recommendations.push('Use ES modules and avoid CommonJS for better tree shaking');

    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# Tree Shaking Analysis Report

## Summary
- **Total Files Analyzed**: ${report.summary.totalFiles}
- **Dead Files**: ${report.summary.deadFiles}
- **Files with Unused Exports**: ${report.summary.filesWithUnusedExports}
- **Potential Savings**: ${report.summary.potentialSavings}

## Dead Code Found

${Object.entries(report.deadCode).map(([file, info]) => {
  if (info.type === 'entire-file') {
    return `### 🗑️ ${path.relative(process.cwd(), file)}
**Reason**: ${info.reason}
**Size**: ${(info.size / 1024).toFixed(2)} KB`;
  } else {
    return `### ⚠️ ${path.relative(process.cwd(), file)}
**Unused Exports**: ${info.exports.join(', ')}
**Reason**: ${info.reason}`;
  }
}).join('\n\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Side Effects Detected

${report.sideEffects.map(file => `- ${path.relative(process.cwd(), file)}`).join('\n')}
`;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const shaker = new AdvancedTreeShaker();
  shaker.analyzeProject().catch(error => {
    console.error('Tree shaking analysis failed:', error);
    process.exit(1);
  });
}

export default AdvancedTreeShaker;
