#!/usr/bin/env node

/**
 * Critical CSS Extraction and Optimization Script
 * Extracts above-the-fold CSS for better Core Web Vitals
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Critical CSS for above-the-fold content
const criticalCSS = `
/* Critical CSS - Above the fold styles */
:root {
  --color-primary: #065f46;
  --color-accent: #059669;
  --color-accent-light: #10b981;
  --color-accent-dark: #047857;
  --glass-surface-bg: rgba(255, 255, 255, 0.85);
  --glass-surface-bg-dark: rgba(17, 24, 39, 0.85);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-dark: rgba(75, 85, 99, 0.2);
  --z-50: 50;
  --ease-emphasized: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base styles for immediate rendering */
html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: 'Open Sans', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Dark mode base */
.dark {
  color-scheme: dark;
}

/* Skip link - critical for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
  border-radius: 4px;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 6px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Critical navbar styles */
.navbar-container {
  background: linear-gradient(120deg, var(--glass-surface-bg) 80%, var(--color-accent-light) 100%);
  backdrop-filter: blur(18px) saturate(1.2);
  border-bottom: 1.5px solid var(--glass-border);
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: var(--z-50);
  transition: all 0.3s var(--ease-emphasized);
}

.dark .navbar-container {
  background: linear-gradient(120deg, var(--glass-surface-bg-dark) 80%, var(--color-accent-dark) 100%);
  border-bottom: 1.5px solid var(--glass-border-dark);
}

/* Essential layout containers */
.max-w-3xl {
  max-width: 48rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.p-4 {
  padding: 1rem;
}

/* Theme transition */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Light theme base colors */
.bg-white {
  background-color: rgb(255 255 255);
}

.text-gray-900 {
  color: rgb(17 24 39);
}

/* Dark theme colors */
.dark .dark\\:bg-gray-900 {
  background-color: rgb(17 24 39);
}

.dark .dark\\:text-gray-100 {
  color: rgb(243 244 246);
}

/* Hide elements initially to prevent FOUC */
.nav-menu {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-menu.loaded {
  opacity: 1;
}
`;

// Minify CSS
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, ';}') // Clean up before closing braces
    .replace(/{\s*/g, '{') // Clean up after opening braces
    .replace(/}\s*/g, '}') // Clean up after closing braces
    .replace(/,\s*/g, ',') // Clean up after commas
    .replace(/:\s*/g, ':') // Clean up after colons
    .replace(/;\s*/g, ';') // Clean up after semicolons
    .trim();
}

// Write critical CSS to output directory
const outputPath = path.join(__dirname, '../public/assets/css/critical.css');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const minifiedCSS = minifyCSS(criticalCSS);
fs.writeFileSync(outputPath, minifiedCSS);

console.log('✅ Critical CSS generated successfully!');
console.log(`   Size: ${(minifiedCSS.length / 1024).toFixed(2)}KB`);
console.log(`   Output: ${outputPath}`);
console.log('\n🎯 Next steps:');
console.log('   1. Add critical CSS inline to <head>');
console.log('   2. Load main CSS asynchronously');
console.log('   3. Test with Lighthouse');
