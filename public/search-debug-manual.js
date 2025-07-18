console.log('🔧 SearchOverlay Debug Script Loading...');

// Check if SearchOverlay is available in different scopes
console.log('Global SearchOverlay:', typeof SearchOverlay);
console.log('Window SearchOverlay:', typeof window.SearchOverlay);
console.log('Window searchOverlay instance:', typeof window.searchOverlay);

// Check if scripts are loaded
const scripts = Array.from(document.scripts).map(s => s.src);
console.log('Scripts loaded:', scripts.filter(s => s.includes('.js')));

// Check if interactive bundle is properly executed
try {
  eval(`
    // Create a test SearchOverlay class
    class TestSearchOverlay {
      constructor() {
        console.log('✅ TestSearchOverlay created successfully');
        this.test = true;
      }
      
      open() {
        console.log('✅ TestSearchOverlay.open() called');
        const overlay = document.getElementById('search-overlay');
        if (overlay) {
          overlay.classList.add('active');
          console.log('✅ Added active class to overlay');
        }
      }
    }
    
    // Make it global
    window.TestSearchOverlay = TestSearchOverlay;
    
    // Try to create an instance
    window.testSearchInstance = new TestSearchOverlay();
    console.log('✅ Test instance created');
  `);
} catch (error) {
  console.error('❌ Error creating test class:', error);
}

// Try to manually execute the SearchOverlay initialization
setTimeout(() => {
  console.log('🔄 Checking SearchOverlay after timeout...');
  console.log('Window searchOverlay after timeout:', typeof window.searchOverlay);
  // Only run manual creation logic in dev/test environments
  if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.searchOverlay) {
    console.log('🔧 Trying to manually create SearchOverlay...');
    // Try to find and execute the SearchOverlay code from the bundle
    fetch('/assets/js/interactive.min.js')
      .then(response => response.text())
      .then(code => {
        console.log('📦 Interactive bundle loaded, size:', code.length);
        // Check if SearchOverlay class is in the code
        if (code.includes('class SearchOverlay')) {
          console.log('✅ SearchOverlay class found in bundle');
          // Extract just the SearchOverlay class and initialization
          const searchOverlayMatch = code.match(/(class SearchOverlay.*?)(window\.setupDropdowns|class NavBarMenu|$)/s);
          if (searchOverlayMatch) {
            const searchOverlayCode = searchOverlayMatch[1];
            console.log('🔍 Extracted SearchOverlay code length:', searchOverlayCode.length);
            try {
              // Execute just the SearchOverlay part
              eval(searchOverlayCode);
              console.log('✅ SearchOverlay code executed');
              // Check if it's now available
              if (typeof SearchOverlay !== 'undefined') {
                console.log('✅ SearchOverlay is now available globally');
                window.searchOverlay = new SearchOverlay();
                console.log('✅ SearchOverlay instance created manually');
              } else {
                console.log('❌ SearchOverlay still not global after eval');
              }
            } catch (evalError) {
              console.error('❌ Error executing SearchOverlay code:', evalError);
            }
          } else {
            console.log('❌ Could not extract SearchOverlay class from bundle');
          }
        } else {
          console.log('❌ SearchOverlay class not found in bundle');
        }
      })
      .catch(error => {
        console.error('❌ Error loading interactive bundle:', error);
      });
  }
}, 2000);
