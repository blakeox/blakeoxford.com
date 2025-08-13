/* eslint-env browser */
/**
 * Manual Search Debug Script (test-only)
 * This script should NOT be shipped to production. It is used by Playwright tests only.
 */

console.log('🔧 Loading search-debug-manual.js (test-only)...');

class TestSearchOverlay {
  constructor() {
    console.log('TestSearchOverlay constructor called');
    this.overlay = document.getElementById('search-overlay');
  }
  open() {
    console.log('TestSearchOverlay.open() called');
    if (this.overlay) {
      this.overlay.classList.add('active');
      return true;
    }
    return false;
  }
  close() {
    console.log('TestSearchOverlay.close() called');
    if (this.overlay) {
      this.overlay.classList.remove('active');
      return true;
    }
    return false;
  }
  isOpen() { return this.overlay?.classList.contains('active') || false; }
}

// @ts-ignore - test-only global
window.TestSearchOverlay = TestSearchOverlay;
try {
  // @ts-ignore - test-only global
  window.testSearchInstance = new TestSearchOverlay();
  console.log('✅ TestSearchOverlay instance created successfully');
} catch (error) {
  console.error('❌ Failed to create TestSearchOverlay instance:', error);
}
if (typeof window.SearchOverlay !== 'undefined') {
  console.log('✅ SearchOverlay found in global scope');
} else {
  console.log('⚠️ SearchOverlay not found in global scope');
  // @ts-ignore - test-only global
  window.SearchOverlay = TestSearchOverlay;
}

console.log('🔧 search-debug-manual.js (test-only) loaded successfully');
