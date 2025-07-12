#!/usr/bin/env node

/**
 * Bundle Optimization Script
 * Combines and minifies JavaScript files to reduce bundle size
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define script categories for optimization
const scriptCategories = {
  critical: [
    'analytics.js',
    'error-handling.js',
    'progressive-enhancement.js'
  ],
  accessibility: [
    'focus-trap.js',
    'accessibility-center.js',
    'a11y.js',
    'enhanced-keyboard-nav.js',
    'motion-accessibility.js',
    'screen-reader-announcements.js'
  ],
  interactive: [
    'search-overlay.js',
    'dropdown.js',
    'NavBarMenu.js'
  ],
  forms: [
    'contact-form-validation.js',
    'accessible-form-validation.js'
  ],
  unused: [
    'SearchOverlayEnhanced.js', // Duplicate of search-overlay.js
    'theme-toggle-debugger.js',  // Debug files
    'theme-debugger.js',
    'voice-navigation.js',       // Advanced feature - load on demand
    'a11y-preferences.js',       // Replaced by accessibility-center.js
    'scroll.js'                  // Potentially unused
  ]
};

const jsDir = path.join(__dirname, '../assets-source/js');
const outputDir = path.join(__dirname, '../public/assets/js');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Simple minification function
 */
function minifyJS(code) {
  return code
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, ';}')
    .replace(/{\s*/g, '{')
    .replace(/}\s*/g, '}')
    .replace(/,\s*/g, ',')
    .replace(/:\s*/g, ':')
    .replace(/;\s*/g, ';')
    .trim();
}

/**
 * Combine and minify scripts by category
 */
function createBundle(category, files) {
  console.log(`Creating ${category} bundle...`);
  
  let combinedCode = '';
  const loadedFiles = [];
  
  for (const file of files) {
    const filePath = path.join(jsDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      combinedCode += `\n/* ${file} */\n${content}\n`;
      loadedFiles.push(file);
    } else {
      console.warn(`Warning: ${file} not found`);
    }
  }
  
  if (combinedCode) {
    const minified = minifyJS(combinedCode);
    const outputPath = path.join(outputDir, `${category}.min.js`);
    fs.writeFileSync(outputPath, minified);
    
    const originalSize = combinedCode.length;
    const minifiedSize = minified.length;
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${category}.min.js created`);
    console.log(`   Files: ${loadedFiles.join(', ')}`);
    console.log(`   Size: ${(minifiedSize / 1024).toFixed(1)}KB (${savings}% reduction)`);
    
    return {
      category,
      files: loadedFiles,
      originalSize,
      minifiedSize,
      savings
    };
  }
  
  return null;
}

/**
 * Create lazy loader for non-critical bundles
 */
function createLazyLoader() {
  const lazyLoaderCode = `
/**
 * Lazy Bundle Loader
 * Loads JavaScript bundles on demand for performance optimization
 */
class LazyBundleLoader {
  constructor() {
    this.loadedBundles = new Set();
    this.loadingPromises = new Map();
  }

  /**
   * Load a bundle asynchronously
   */
  async loadBundle(bundleName) {
    if (this.loadedBundles.has(bundleName)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(bundleName)) {
      return this.loadingPromises.get(bundleName);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = \`/assets/js/\${bundleName}.min.js\`;
      script.async = true;
      
      script.onload = () => {
        this.loadedBundles.add(bundleName);
        this.loadingPromises.delete(bundleName);
        resolve();
      };
      
      script.onerror = () => {
        this.loadingPromises.delete(bundleName);
        reject(new Error(\`Failed to load bundle: \${bundleName}\`));
      };
      
      document.head.appendChild(script);
    });

    this.loadingPromises.set(bundleName, promise);
    return promise;
  }

  /**
   * Load external library (like Fuse.js) on demand
   */
  async loadExternalLibrary(libName, url) {
    if (this.loadedBundles.has(libName)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(libName)) {
      return this.loadingPromises.get(libName);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        this.loadedBundles.add(libName);
        this.loadingPromises.delete(libName);
        resolve();
      };
      
      script.onerror = () => {
        this.loadingPromises.delete(libName);
        reject(new Error(\`Failed to load library: \${libName}\`));
      };
      
      document.head.appendChild(script);
    });

    this.loadingPromises.set(libName, promise);
    return promise;
  }

  /**
   * Load accessibility features when needed
   */
  async loadAccessibilityFeatures() {
    return this.loadBundle('accessibility');
  }

  /**
   * Load interactive features when needed
   */
  async loadInteractiveFeatures() {
    // Load Fuse.js for search functionality
    await Promise.all([
      this.loadBundle('interactive'),
      this.loadExternalLibrary('fuse', 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js')
    ]);
  }

  /**
   * Load form validation when needed
   */
  async loadFormFeatures() {
    return this.loadBundle('forms');
  }
}

// Global lazy loader instance
window.LazyBundleLoader = new LazyBundleLoader();

// Load accessibility features on interaction or preference
const loadA11yOnInteraction = () => {
  const events = ['keydown', 'click', 'focus'];
  const loadOnce = () => {
    window.LazyBundleLoader.loadAccessibilityFeatures();
    events.forEach(event => {
      document.removeEventListener(event, loadOnce, true);
    });
  };
  
  events.forEach(event => {
    document.addEventListener(event, loadOnce, true);
  });
  
  // Also load if user has accessibility preferences
  if (localStorage.getItem('accessibility-preferences')) {
    loadOnce();
  }
};

// Load interactive features when page is interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.LazyBundleLoader.loadInteractiveFeatures(), 100);
  });
} else {
  setTimeout(() => window.LazyBundleLoader.loadInteractiveFeatures(), 100);
}

// Initialize accessibility loading
loadA11yOnInteraction();
`;

  const outputPath = path.join(outputDir, 'lazy-loader.min.js');
  fs.writeFileSync(outputPath, minifyJS(lazyLoaderCode));
  console.log('✅ lazy-loader.min.js created');
}

// Main execution
async function optimizeBundles() {
  console.log('🚀 Starting JavaScript bundle optimization...\n');
  
  const results = [];
  
  // Create bundles for each category
  for (const [category, files] of Object.entries(scriptCategories)) {
    if (category !== 'unused') {
      const result = createBundle(category, files);
      if (result) results.push(result);
    }
  }
  
  // Create lazy loader
  createLazyLoader();
  
  // Calculate total savings
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalMinified = results.reduce((sum, r) => sum + r.minifiedSize, 0);
  const totalSavings = ((totalOriginal - totalMinified) / totalOriginal * 100).toFixed(1);
  
  console.log('\n📊 Bundle Optimization Summary:');
  console.log(`   Original size: ${(totalOriginal / 1024).toFixed(1)}KB`);
  console.log(`   Minified size: ${(totalMinified / 1024).toFixed(1)}KB`);
  console.log(`   Total savings: ${totalSavings}%`);
  
  console.log('\n🗑️  Unused files (should be removed):');
  scriptCategories.unused.forEach(file => {
    const filePath = path.join(jsDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    }
  });
  
  console.log('\n✅ Bundle optimization complete!');
  console.log('   Next steps:');
  console.log('   1. Update BaseLayout.astro to use optimized bundles');
  console.log('   2. Remove unused JavaScript files');
  console.log('   3. Test all functionality');
}

optimizeBundles().catch(console.error);
