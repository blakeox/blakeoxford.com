#!/usr/bin/env node

/**
 * Advanced Bundle Analysis & Tree Shaking
 * Identifies unused code and optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analyze all JavaScript files for usage patterns
async function analyzeCodeUsage() {
  const jsDir = path.join(__dirname, '../public/assets/js');
  const sourceDir = path.join(__dirname, '../assets-source/js');

  console.log('🔍 ADVANCED BUNDLE ANALYSIS\n');

  // Read all source files
  const sourceFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.js'));
  const usageMap = new Map();

  for (const file of sourceFiles) {
    const content = fs.readFileSync(path.join(sourceDir, file), 'utf-8');

    // Extract function declarations
    const functions = content.match(/function\s+(\w+)/g) || [];
    const classes = content.match(/class\s+(\w+)/g) || [];
    const exports = content.match(/(?:export\s+(?:const|let|var|function|class)\s+(\w+))|(?:exports\.(\w+))/g) || [];

    usageMap.set(file, {
      functions: functions.map(f => f.replace('function ', '')),
      classes: classes.map(c => c.replace('class ', '')),
      exports: exports,
      size: content.length,
      lines: content.split('\n').length
    });
  }

  // Analyze cross-references
  console.log('📊 CODE USAGE ANALYSIS:');
  for (const [file, data] of usageMap) {
    console.log(`\n📁 ${file}:`);
    console.log(`   Lines: ${data.lines}`);
    console.log(`   Size: ${(data.size / 1024).toFixed(2)}KB`);
    console.log(`   Functions: ${data.functions.length}`);
    console.log(`   Classes: ${data.classes.length}`);

    // Check for potential dead code
    const allContent = Array.from(usageMap.values()).map(d => d.content).join('');
    const unusedFunctions = data.functions.filter(fn =>
      !allContent.includes(fn + '(') &&
      !allContent.includes(fn + ' ') &&
      fn !== 'addEventListener' && // Common patterns to ignore
      fn !== 'querySelector'
    );

    if (unusedFunctions.length > 0) {
      console.log(`   ⚠️  Potentially unused: ${unusedFunctions.join(', ')}`);
    }
  }

  // Bundle size recommendations
  console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');

  const totalSize = Array.from(usageMap.values()).reduce((sum, data) => sum + data.size, 0);
  console.log(`\n📦 Current bundle metrics:`);
  console.log(`   Total source size: ${(totalSize / 1024).toFixed(2)}KB`);
  console.log(`   Average file size: ${(totalSize / usageMap.size / 1024).toFixed(2)}KB`);

  // Check for optimization opportunities
  const largeFiles = Array.from(usageMap.entries())
    .filter(([, data]) => data.size > 10000)
    .sort((a, b) => b[1].size - a[1].size);

  if (largeFiles.length > 0) {
    console.log(`\n🔍 Large files to review:`);
    largeFiles.forEach(([file, data]) => {
      console.log(`   ${file}: ${(data.size / 1024).toFixed(2)}KB`);
    });
  }

  // Generate tree-shaking report
  console.log('\n🌳 TREE SHAKING OPPORTUNITIES:');
  console.log('   1. Remove console.log statements in production');
  console.log('   2. Eliminate unused utility functions');
  console.log('   3. Use dynamic imports for rarely-used features');
  console.log('   4. Consider splitting large files into smaller modules');

  return usageMap;
}

// Main execution
analyzeCodeUsage().catch(console.error);
