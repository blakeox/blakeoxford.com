/**
 * Debug SearchOverlay Global Exposure
 * Test whether SearchOverlay class is properly exposed after bundle fix
 */

// Simulate loading the interactive bundle content
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundlePath = path.join(__dirname, 'public', 'assets', 'js', 'interactive.min.js');

if (!fs.existsSync(bundlePath)) {
  console.error('❌ Bundle not found:', bundlePath);
  process.exit(1);
}

const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Check for global exposure pattern
const hasGlobalExposure = bundleContent.includes('window.SearchOverlay=SearchOverlay') || 
                         bundleContent.includes('window.SearchOverlay = SearchOverlay');

console.log('🔍 SearchOverlay Bundle Analysis:');
console.log('=====================================');
console.log('📁 Bundle path:', bundlePath);
console.log('📏 Bundle size:', (bundleContent.length / 1024).toFixed(1) + 'KB');
console.log('');

console.log('🔎 Code Pattern Analysis:');
console.log('- SearchOverlay class definition:', bundleContent.includes('class SearchOverlay') ? '✅' : '❌');
console.log('- Global window exposure:', hasGlobalExposure ? '✅' : '❌');
console.log('- Initialization function:', bundleContent.includes('initializeSearchOverlay') ? '✅' : '❌');
console.log('- Constructor logging:', bundleContent.includes('SearchOverlay constructor called') ? '✅' : '❌');
console.log('- Keyboard shortcuts setup:', bundleContent.includes('setupKeyboardShortcuts') ? '✅' : '❌');
console.log('');

// Check specific global exposure patterns
const globalPatterns = [
  'window.SearchOverlay=SearchOverlay',
  'window.SearchOverlay = SearchOverlay',
  'window["SearchOverlay"]=SearchOverlay',
  'window.SearchOverlay=class',
];

const foundPattern = globalPatterns.find(pattern => bundleContent.includes(pattern));

if (foundPattern) {
  console.log('✅ Found global exposure pattern:', foundPattern);
} else {
  console.log('❌ No global exposure pattern found');
  console.log('   Checking for any SearchOverlay window assignments...');
  
  const windowSearchOverlayMatches = bundleContent.match(/window\.SearchOverlay[^;]*;?/g);
  if (windowSearchOverlayMatches) {
    console.log('   Found window.SearchOverlay references:');
    windowSearchOverlayMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match}`);
    });
  } else {
    console.log('   No window.SearchOverlay references found');
  }
}

console.log('');

// Extract first few lines to see structure
const firstLines = bundleContent.split('\n').slice(0, 5);
console.log('📝 Bundle structure (first 5 lines):');
firstLines.forEach((line, index) => {
  console.log(`${index + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
});

console.log('');
console.log('🧪 Running simulated browser test...');

// Create a fake window object
const window = {};

try {
  // Execute the bundle code
  eval(bundleContent);
  
  console.log('✅ Bundle executed successfully');
  console.log('🔍 SearchOverlay availability:', typeof window.SearchOverlay);
  
  if (typeof window.SearchOverlay === 'function') {
    console.log('✅ SearchOverlay class is properly exposed to window object');
    console.log('🧪 Testing SearchOverlay instantiation...');
    
    // Mock DOM elements for constructor
    global.document = {
      getElementById: () => null,
      readyState: 'complete',
      addEventListener: () => {},
      createElement: () => ({ style: {}, onclick: null }),
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      activeElement: null
    };
    
    try {
      const testInstance = new window.SearchOverlay();
      console.log('✅ SearchOverlay instance created successfully');
      console.log('🔧 Instance methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(testInstance)));
    } catch (error) {
      console.log('❌ Failed to create SearchOverlay instance:', error.message);
    }
    
  } else {
    console.log('❌ SearchOverlay class is not properly exposed');
    console.log('   Available on window:', Object.keys(window));
  }
  
} catch (error) {
  console.log('❌ Bundle execution failed:', error.message);
}

console.log('');
console.log('📋 Summary:');
console.log('===========');
if (hasGlobalExposure && typeof window.SearchOverlay === 'function') {
  console.log('🎉 SUCCESS: SearchOverlay is properly exposed and functional');
} else {
  console.log('💥 ISSUE: SearchOverlay exposure needs additional work');
  if (!hasGlobalExposure) {
    console.log('   - Global exposure pattern not found in bundle');
  }
  if (typeof window.SearchOverlay !== 'function') {
    console.log('   - SearchOverlay class not accessible on window object');
  }
}
