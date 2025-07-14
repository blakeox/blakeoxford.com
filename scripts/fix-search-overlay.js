#!/usr/bin/env node

/**
 * Search Overlay Comprehensive Fix Script
 * Fixes bundle optimization, initialization, and CSS issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Starting comprehensive search overlay fix...\n');

// Step 1: Fix source file to ensure robust initialization
async function fixSourceFile() {
  console.log('1️⃣ Fixing SearchOverlay source file...');
  
  const sourcePath = path.join(__dirname, '../assets-source/js/search-overlay.js');
  let content = fs.readFileSync(sourcePath, 'utf8');
  
  // Ensure proper error handling and initialization logging
  const initializationCode = `
// Initialize search overlay when DOM is ready with comprehensive error handling
(function initializeSearchOverlay() {
  console.log('🔍 Initializing SearchOverlay...');
  
  function createSearchOverlay() {
    try {
      if (window.searchOverlay) {
        console.log('SearchOverlay already exists, skipping creation');
        return;
      }
      
      console.log('Creating new SearchOverlay instance');
      window.searchOverlay = new SearchOverlay();
      console.log('✅ SearchOverlay instance created successfully');
      
      // Add a test button for debugging (development only)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
          const testButton = document.createElement('button');
          testButton.innerHTML = 'TEST SEARCH';
          testButton.style.cssText = \`
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          \`;
          testButton.onclick = () => {
            console.log('🧪 Test button clicked, trying to open search');
            if (window.searchOverlay) {
              window.searchOverlay.open();
            } else {
              console.error('❌ searchOverlay not found on window object');
            }
          };
          document.body.appendChild(testButton);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to create SearchOverlay:', error);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded, creating SearchOverlay');
      createSearchOverlay();
    });
  } else {
    console.log('DOM already loaded, creating SearchOverlay immediately');
    createSearchOverlay();
  }
})();`;

  // Replace the existing initialization code
  content = content.replace(
    /\/\/ Initialize search overlay when DOM is ready[\s\S]*$/,
    initializationCode
  );
  
  fs.writeFileSync(sourcePath, content);
  console.log('✅ Source file updated with robust initialization');
}

// Step 2: Rebuild bundles with fixed minification
async function rebuildBundles() {
  console.log('\n2️⃣ Rebuilding bundles with fixed minification...');
  
  // Import and run the optimize-bundle script
  const { execSync } = await import('child_process');
  try {
    execSync('node scripts/optimize-bundle.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Bundles rebuilt successfully');
  } catch (error) {
    console.error('❌ Bundle rebuild failed:', error.message);
  }
}

// Step 3: Add comprehensive CSS fixes
async function fixSearchOverlayCSS() {
  console.log('\n3️⃣ Adding comprehensive CSS fixes...');
  
  const cssPath = path.join(__dirname, '../src/styles/global.css');
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Add search overlay specific fixes if not already present
  const searchOverlayFixes = `
/* Search Overlay Comprehensive Fixes */
.search-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: var(--z-modal, 9999) !important;
  background: var(--overlay-40) !important;
  backdrop-filter: blur(var(--blur-lg)) !important;
  -webkit-backdrop-filter: blur(var(--blur-lg)) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  transition: all 0.3s var(--ease-emphasized) !important;
}

.search-overlay.active {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

/* Debug styles for development */
.search-overlay[data-debug="true"] {
  background: rgba(255, 0, 0, 0.3) !important;
  border: 2px solid red !important;
}

.search-overlay[data-debug="true"].active {
  background: rgba(0, 255, 0, 0.3) !important;
  border: 2px solid green !important;
}

/* Ensure search container is properly positioned */
.search-container.minimalist {
  position: relative !important;
  z-index: 2 !important;
}
`;

  // Only add if not already present
  if (!cssContent.includes('Search Overlay Comprehensive Fixes')) {
    cssContent += searchOverlayFixes;
    fs.writeFileSync(cssPath, cssContent);
    console.log('✅ CSS fixes added');
  } else {
    console.log('✅ CSS fixes already present');
  }
}

// Step 4: Create a comprehensive test script
async function createTestScript() {
  console.log('\n4️⃣ Creating comprehensive test script...');
  
  const testScriptContent = `
/**
 * Comprehensive Search Overlay Test
 * Tests all aspects of search functionality
 */

console.log('🧪 Starting comprehensive search overlay test...');

// Test 1: Check if SearchOverlay class exists
console.log('Test 1: SearchOverlay class availability');
if (typeof SearchOverlay !== 'undefined') {
  console.log('✅ SearchOverlay class is defined');
} else {
  console.log('❌ SearchOverlay class is not defined');
}

// Test 2: Check if instance exists on window
console.log('Test 2: SearchOverlay instance availability');
if (window.searchOverlay) {
  console.log('✅ window.searchOverlay exists');
  console.log('   Type:', typeof window.searchOverlay);
  console.log('   Constructor:', window.searchOverlay.constructor.name);
} else {
  console.log('❌ window.searchOverlay does not exist');
}

// Test 3: Check DOM elements
console.log('Test 3: DOM elements availability');
const overlay = document.getElementById('search-overlay');
const input = document.getElementById('search-input');
const results = document.getElementById('search-results');

console.log('   search-overlay element:', !!overlay);
console.log('   search-input element:', !!input);
console.log('   search-results element:', !!results);

if (overlay) {
  console.log('   overlay classes:', overlay.className);
  console.log('   overlay computed display:', getComputedStyle(overlay).display);
  console.log('   overlay computed opacity:', getComputedStyle(overlay).opacity);
  console.log('   overlay computed visibility:', getComputedStyle(overlay).visibility);
}

// Test 4: Test manual triggering
console.log('Test 4: Manual trigger test');
if (window.searchOverlay && typeof window.searchOverlay.open === 'function') {
  console.log('✅ SearchOverlay.open method exists');
  
  // Add debug attribute for CSS debugging
  if (overlay) {
    overlay.setAttribute('data-debug', 'true');
  }
  
  // Test opening
  setTimeout(() => {
    console.log('🔓 Attempting to open search overlay...');
    try {
      window.searchOverlay.open();
      
      setTimeout(() => {
        console.log('   After open attempt:');
        console.log('     isOpen:', window.searchOverlay.isOpen);
        console.log('     overlay classes:', overlay?.className);
        console.log('     overlay visibility:', getComputedStyle(overlay || {}).visibility);
        console.log('     overlay opacity:', getComputedStyle(overlay || {}).opacity);
      }, 500);
    } catch (error) {
      console.error('❌ Failed to open search overlay:', error);
    }
  }, 2000);
} else {
  console.log('❌ SearchOverlay.open method not available');
}

// Test 5: Keyboard shortcuts
console.log('Test 5: Keyboard shortcuts');
setTimeout(() => {
  console.log('🎹 Testing Ctrl+K shortcut...');
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: true,
    bubbles: true
  }));
}, 3000);

// Test 6: Bundle loading
console.log('Test 6: Bundle loading status');
const scripts = Array.from(document.scripts);
const interactiveScript = scripts.find(s => s.src.includes('interactive'));
console.log('   interactive bundle loaded:', !!interactiveScript);
if (interactiveScript) {
  console.log('   interactive bundle src:', interactiveScript.src);
}

// Test 7: Error monitoring
window.addEventListener('error', (e) => {
  console.error('🚨 JavaScript Error Detected:', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error
  });
});

console.log('🧪 Comprehensive test setup complete. Check console for results.');
`;

  const testPath = path.join(__dirname, '../public/search-debug-comprehensive.js');
  fs.writeFileSync(testPath, testScriptContent);
  console.log('✅ Comprehensive test script created at public/search-debug-comprehensive.js');
}

// Main execution
async function main() {
  try {
    await fixSourceFile();
    await rebuildBundles();
    await fixSearchOverlayCSS();
    await createTestScript();
    
    console.log('\n🎉 Comprehensive search overlay fix complete!');
    console.log('\nNext steps:');
    console.log('1. Restart your dev server');
    console.log('2. Open browser console');
    console.log('3. Load the test script: <script src="/search-debug-comprehensive.js"></script>');
    console.log('4. Try Ctrl+K or click the TEST SEARCH button');
    console.log('5. Check console logs for detailed diagnostics');
    
  } catch (error) {
    console.error('❌ Fix script failed:', error);
    process.exit(1);
  }
}

main();
