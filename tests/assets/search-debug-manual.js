/**
 * Manual Search Debug Script (test-only)
 * Not shipped to production; injected by Playwright with addInitScript.
 * Wrapped to avoid ESLint no-undef for window/document in Node lint context.
 */
(function (win, doc) {
  console.log('🔧 Loading search-debug-manual.js (test-only)...');

  class TestSearchOverlay {
    constructor() {
      console.log('TestSearchOverlay constructor called');
      this.overlay = doc && doc.getElementById ? doc.getElementById('search-overlay') : null;
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
    isOpen() { return !!(this.overlay && this.overlay.classList && this.overlay.classList.contains('active')); }
  }

  // Expose globals for tests
  // @ts-ignore - test-only global
  win.TestSearchOverlay = TestSearchOverlay;
  try {
    // @ts-ignore - test-only global
    win.testSearchInstance = new TestSearchOverlay();
    console.log('✅ TestSearchOverlay instance created successfully');
  } catch (error) {
    console.error('❌ Failed to create TestSearchOverlay instance:', error);
  }
  if (typeof win.SearchOverlay !== 'undefined') {
    console.log('✅ SearchOverlay found in global scope');
  } else {
    console.log('⚠️ SearchOverlay not found in global scope');
    // @ts-ignore - test-only global
    win.SearchOverlay = TestSearchOverlay;
  }

  console.log('🔧 search-debug-manual.js (test-only) loaded successfully');
})(globalThis, /** @type {Document|undefined} */ (typeof globalThis !== 'undefined' && 'document' in globalThis ? globalThis.document : undefined));
