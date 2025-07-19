// Debug script for navbar functionality
console.log('🔍 NavBar Debug Script Loaded');

// Check if required elements exist
function checkElements() {
  const elements = {
    navbar: document.querySelector('[data-navbar]'),
    navToggle: document.getElementById('nav-toggle'),
    mobileMenu: document.getElementById('nav-mobile-links'),
    searchToggle: document.getElementById('search-toggle'),
    overlay: document.querySelector('.mobile-menu-overlay')
  };
  
  console.log('📋 Element Check Results:');
  Object.entries(elements).forEach(([name, element]) => {
    console.log(`${element ? '✅' : '❌'} ${name}:`, element ? 'Found' : 'Not found');
  });
  
  return elements;
}

// Check if JavaScript bundles are loaded
function checkBundles() {
  console.log('📦 Bundle Check Results:');
  
  const bundles = {
    'window.navBarMenu': window.navBarMenu,
    'window.efficientNavBar': window.efficientNavBar,
    'window.LazyBundleLoader': window.LazyBundleLoader,
    'window.searchOverlay': window.searchOverlay
  };
  
  Object.entries(bundles).forEach(([name, bundle]) => {
    console.log(`${bundle ? '✅' : '❌'} ${name}:`, bundle ? typeof bundle : 'Not loaded');
  });
}

// Test hamburger menu functionality
function testHamburgerMenu() {
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('nav-mobile-links');
  
  if (!navToggle || !mobileMenu) {
    console.log('❌ Cannot test hamburger menu - elements not found');
    return;
  }
  
  console.log('🧪 Testing hamburger menu...');
  
  // Check current state
  const isOpen = mobileMenu.classList.contains('open');
  const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
  
  console.log('Current state:', {
    isOpen,
    isExpanded,
    mobileMenuClasses: mobileMenu.className,
    navToggleClasses: navToggle.className
  });
  
  // Test click functionality
  console.log('🖱️ Testing click functionality...');
  navToggle.click();
  
  setTimeout(() => {
    const newIsOpen = mobileMenu.classList.contains('open');
    const newIsExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    
    console.log('After click:', {
      isOpen: newIsOpen,
      isExpanded: newIsExpanded,
      changed: newIsOpen !== isOpen
    });
    
    // Reset if it opened
    if (newIsOpen && !isOpen) {
      setTimeout(() => {
        console.log('🔄 Resetting menu...');
        navToggle.click();
      }, 1000);
    }
  }, 100);
}

// Check CSS classes and styles
function checkStyles() {
  const mobileMenu = document.getElementById('nav-mobile-links');
  if (!mobileMenu) return;
  
  const styles = window.getComputedStyle(mobileMenu);
  console.log('🎨 Mobile Menu Styles:');
  console.log('- display:', styles.display);
  console.log('- visibility:', styles.visibility);
  console.log('- opacity:', styles.opacity);
  console.log('- transform:', styles.transform);
  console.log('- z-index:', styles.zIndex);
}

// Run all checks
function runDebugChecks() {
  console.log('🚀 Starting NavBar Debug Checks...');
  
  checkElements();
  checkBundles();
  checkStyles();
  
  // Wait a bit then test hamburger
  setTimeout(testHamburgerMenu, 500);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runDebugChecks);
} else {
  runDebugChecks();
}

// Also run after a delay to catch late-loaded content
setTimeout(runDebugChecks, 2000);

// Export for manual testing
window.debugNavbar = {
  checkElements,
  checkBundles,
  testHamburgerMenu,
  checkStyles,
  runDebugChecks
}; 