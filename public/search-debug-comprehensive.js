
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
