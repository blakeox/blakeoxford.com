#!/usr/bin/env node

/**
 * Resource Preloading Optimization Script
 * Generates preload directives for critical resources
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Critical resources for preloading
const criticalResources = {
  scripts: [
    '/assets/js/critical.min.js',
    '/assets/js/lazy-loader.min.js'
  ],
  styles: [
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap'
  ],
  images: [
    '/assets/images/Blake-O-scaled.jpg', // Hero image
    '/assets/images/blake-logo-fallback.png' // Logo fallback
  ],
  fonts: [
    'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4taVIUxC-l.woff2'
  ]
};

// Generate preload HTML
function generatePreloadHTML() {
  let html = '<!-- Generated Resource Preloads -->\n';
  
  // Scripts
  criticalResources.scripts.forEach(script => {
    html += `    <link rel="preload" href="${script}" as="script" />\n`;
  });
  
  // Fonts (highest priority)
  criticalResources.fonts.forEach(font => {
    html += `    <link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin />\n`;
  });
  
  // Images (LCP candidates)
  criticalResources.images.forEach(image => {
    html += `    <link rel="preload" href="${image}" as="image" />\n`;
  });
  
  return html;
}

// Write outputs
const preloadHTML = generatePreloadHTML();

const htmlOutputPath = path.join(__dirname, '../src/components/PreloadTags.astro');
const htmlContent = `---
// Auto-generated preload tags for critical resources
// Run 'node scripts/generate-preloads.js' to regenerate
---

${preloadHTML}`;

fs.writeFileSync(htmlOutputPath, htmlContent);

console.log('✅ Resource preloading optimization complete!');
console.log(`   HTML preloads: ${htmlOutputPath}`);
console.log(`   Critical scripts: ${criticalResources.scripts.length}`);
console.log(`   Critical fonts: ${criticalResources.fonts.length}`);
console.log(`   Critical images: ${criticalResources.images.length}`);
console.log('\n🎯 Preload benefits:');
console.log('   • Faster script execution');
console.log('   • Reduced font flash (FOUT)');
console.log('   • Improved LCP for hero images');
console.log('   • Better Core Web Vitals scores');
