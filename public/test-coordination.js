// test-coordination.js - Quick test script for navbar-sticky nav coordination
// Run this in the browser console on the about page to test coordination

console.log('=== Testing Navbar-Sticky Nav Coordination ===');

// Test 1: Check if navbar state management is working
console.log('1. Testing navbar state management...');
const navbar = document.querySelector('[data-navbar]');
const stickyNav = document.getElementById('sticky-nav');

if (navbar) {
  console.log('✅ Navbar found');
} else {
  console.log('❌ Navbar not found');
}

if (stickyNav) {
  console.log('✅ Sticky nav found');
} else {
  console.log('❌ Sticky nav not found - test only on about page');
}

// Test 2: Check initial state
const currentState = document.documentElement.getAttribute('data-navbar-state');
console.log('2. Current navbar state:', currentState || 'not set');

// Test 3: Check if CSS custom property is set
const cssState = getComputedStyle(document.documentElement).getPropertyValue('--navbar-state');
console.log('3. CSS custom property --navbar-state:', cssState.trim() || 'not set');

// Test 4: Test manual state change
console.log('4. Testing manual state changes...');
if (window.updateNavbarState) {
  console.log('✅ updateNavbarState function available');
  
  // Test hiding navbar
  console.log('Hiding navbar...');
  window.updateNavbarState(true);
  
  setTimeout(() => {
    const hiddenState = document.documentElement.getAttribute('data-navbar-state');
    console.log('State after hiding:', hiddenState);
    
    // Test showing navbar
    console.log('Showing navbar...');
    window.updateNavbarState(false);
    
    setTimeout(() => {
      const visibleState = document.documentElement.getAttribute('data-navbar-state');
      console.log('State after showing:', visibleState);
      console.log('=== Test Complete ===');
    }, 500);
  }, 500);
} else {
  console.log('❌ updateNavbarState function not available');
}

// Test 5: Check if event listeners are working
console.log('5. Testing event coordination...');
document.addEventListener('navbarStateChange', (event) => {
  console.log('🎉 Navbar state change event received:', event.detail);
});

// Test 6: Check if sticky nav coordinator is loaded
if (window.stickyNavCoordinator) {
  console.log('✅ Sticky nav coordinator loaded');
} else {
  console.log('⚠️ Sticky nav coordinator not loaded (only loads on about page)');
}
