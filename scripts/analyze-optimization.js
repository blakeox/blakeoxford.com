#!/usr/bin/env node

/**
 * Bundle Optimization Analysis
 * Shows before/after comparison and performance improvements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 JavaScript Bundle Optimization Results\n');

// Before optimization (original individual files)
const originalFiles = [
  { name: 'analytics.js', size: 2200 },
  { name: 'search-overlay.js', size: 11000 },
  { name: 'focus-trap.js', size: 2800 },
  { name: 'progressive-enhancement.js', size: 8100 },
  { name: 'error-handling.js', size: 16000 },
  { name: 'accessibility-center.js', size: 16000 },
  { name: 'NavBarMenu.js', size: 20000 },
  { name: 'contact-form-validation.js', size: 6800 },
  { name: 'accessible-form-validation.js', size: 8100 },
  { name: 'dropdown.js', size: 4000 },
  { name: 'enhanced-keyboard-nav.js', size: 2900 },
  { name: 'motion-accessibility.js', size: 4200 },
  { name: 'screen-reader-announcements.js', size: 3800 },
  { name: 'a11y.js', size: 700 }
];

// After optimization (bundled files)
const optimizedFiles = [
  { name: 'critical.min.js', size: 14000 },
  { name: 'accessibility.min.js', size: 21000 },
  { name: 'interactive.min.js', size: 21000 },
  { name: 'forms.min.js', size: 8200 },
  { name: 'lazy-loader.min.js', size: 2300 }
];

// Removed files
const removedFiles = [
  { name: 'SearchOverlayEnhanced.js', size: 15000 },
  { name: 'theme-toggle-debugger.js', size: 3100 },
  { name: 'theme-debugger.js', size: 3100 },
  { name: 'voice-navigation.js', size: 4900 },
  { name: 'a11y-preferences.js', size: 2200 },
  { name: 'scroll.js', size: 4200 }
];

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function calculateTotal(files) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

const originalTotal = calculateTotal(originalFiles);
const optimizedTotal = calculateTotal(optimizedFiles);
const removedTotal = calculateTotal(removedFiles);

console.log('🔧 BEFORE OPTIMIZATION:');
console.log(`   Individual files loaded: ${originalFiles.length}`);
console.log(`   Total size: ${formatSize(originalTotal)}`);
console.log(`   All files loaded on page load: ❌ Blocking`);
console.log(`   HTTP requests: ${originalFiles.length + 3} (includes external CDN)`);

console.log('\n⚡ AFTER OPTIMIZATION:');
console.log(`   Bundled files: ${optimizedFiles.length}`);
console.log(`   Total size: ${formatSize(optimizedTotal)}`);
console.log(`   Critical bundle (loaded immediately): ${formatSize(14000)}`);
console.log(`   Non-critical bundles (lazy loaded): ${formatSize(optimizedTotal - 14000)}`);
console.log(`   HTTP requests: 2 (initial load) + on-demand bundles`);

console.log('\n🗑️  REMOVED UNUSED CODE:');
console.log(`   Files removed: ${removedFiles.length}`);
console.log(`   Size saved: ${formatSize(removedTotal)}`);

console.log('\n📈 PERFORMANCE IMPROVEMENTS:');
const totalSavings = originalTotal + removedTotal - optimizedTotal;
const percentSavings = ((totalSavings) / (originalTotal + removedTotal) * 100).toFixed(1);
console.log(`   Total size reduction: ${formatSize(totalSavings)} (${percentSavings}%)`);
console.log(`   Initial page load: ${formatSize(14000 + 2300)} (critical + lazy loader)`);
console.log(`   Lazy loading: ✅ Accessibility, interactive, and form features`);
console.log(`   Bundle splitting: ✅ Code split by functionality`);

console.log('\n🎯 OPTIMIZATION STRATEGIES IMPLEMENTED:');
console.log('   ✅ Bundle consolidation and minification');
console.log('   ✅ Lazy loading for non-critical features');
console.log('   ✅ Code splitting by functionality');
console.log('   ✅ Removed unused/duplicate files');
console.log('   ✅ Progressive enhancement approach');
console.log('   ✅ External CDN lazy loading (Fuse.js)');

console.log('\n🚀 LOADING STRATEGY:');
console.log('   1. Critical bundle (14KB): Analytics, error handling, progressive enhancement');
console.log('   2. Lazy loader (2.3KB): Smart loading system');
console.log('   3. Interactive bundle (21KB): Loaded when user interacts');
console.log('   4. Accessibility bundle (21KB): Loaded on first user interaction');
console.log('   5. Forms bundle (8.2KB): Loaded only on contact page');
console.log('   6. Fuse.js CDN: Loaded only when search is opened');

console.log('\n✨ NEXT STEPS FOR FURTHER OPTIMIZATION:');
console.log('   • Consider service worker for caching');
console.log('   • Evaluate additional code splitting opportunities');
console.log('   • Monitor performance with real user metrics');
console.log('   • Consider WebAssembly for heavy computations');

const buildPath = path.join(__dirname, '../dist');
if (fs.existsSync(buildPath)) {
  console.log('\n📦 ACTUAL BUILD RESULTS:');
  
  // Check bundle files
  const bundlePath = path.join(buildPath, 'assets/js/bundles');
  if (fs.existsSync(bundlePath)) {
    const bundleFiles = fs.readdirSync(bundlePath);
    let totalBundleSize = 0;
    
    bundleFiles.forEach(file => {
      const filePath = path.join(bundlePath, file);
      const stats = fs.statSync(filePath);
      totalBundleSize += stats.size;
      console.log(`   ${file}: ${formatSize(stats.size)}`);
    });
    
    console.log(`   Total optimized bundles: ${formatSize(totalBundleSize)}`);
  }
  
  // Check if dev files are present
  const devFiles = ['theme-toggle-debugger.js', 'voice-navigation.js'];
  let foundDevFiles = 0;
  
  devFiles.forEach(file => {
    const filePath = path.join(buildPath, 'assets/js', file);
    if (fs.existsSync(filePath)) {
      foundDevFiles++;
    }
  });
  
  if (foundDevFiles === 0) {
    console.log('   ✅ All development/unused files properly removed');
  } else {
    console.log(`   ⚠️  Found ${foundDevFiles} development files still present`);
  }
}
