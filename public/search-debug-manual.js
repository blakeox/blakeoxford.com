/**
 * Manual Search Debug Script
 * This script provides debugging capabilities for the SearchOverlay component
 * in Playwright tests by manually creating SearchOverlay instances.
 */

console.log('🔧 Loading search-debug-manual.js...');

// Create a simplified SearchOverlay for testing
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

  isOpen() {
    return this.overlay?.classList.contains('active') || false;
  }
}

// Export to global scope for tests
window.TestSearchOverlay = TestSearchOverlay;

// Create a test instance
try {
  window.testSearchInstance = new TestSearchOverlay();
  console.log('✅ TestSearchOverlay instance created successfully');
} catch (error) {
  console.error('❌ Failed to create TestSearchOverlay instance:', error);
}

// Also provide direct SearchOverlay access if it exists
if (typeof window.SearchOverlay !== 'undefined') {
  console.log('✅ SearchOverlay found in global scope');
} else {
  console.log('⚠️ SearchOverlay not found in global scope');
  // Create a mock SearchOverlay for testing
  window.SearchOverlay = TestSearchOverlay;
}

console.log('🔧 search-debug-manual.js loaded successfully');