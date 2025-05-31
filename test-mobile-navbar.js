// Test script to verify mobile navbar functionality
// This can be run in the browser console to test mobile interactions

console.log('Testing mobile navbar functionality...');

// Test 1: Check if mobile menu elements exist
const mobileMenuToggle = document.querySelector('[data-mobile-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
const searchToggle = document.querySelector('[data-search-toggle]');
const themeToggle = document.querySelector('[data-theme-toggle]');

console.log('Mobile menu toggle:', mobileMenuToggle ? '✅ Found' : '❌ Not found');
console.log('Mobile menu:', mobileMenu ? '✅ Found' : '❌ Not found');
console.log('Search toggle:', searchToggle ? '✅ Found' : '❌ Not found');
console.log('Theme toggle:', themeToggle ? '✅ Found' : '❌ Not found');

// Test 2: Check if NavBarMenu.js is loaded
const navBarMenuLoaded = window.NavBarMenu || document.querySelector('script[src*="NavBarMenu.js"]');
console.log('NavBarMenu.js:', navBarMenuLoaded ? '✅ Loaded' : '❌ Not loaded');

// Test 3: Simulate mobile menu toggle
if (mobileMenuToggle) {
  console.log('Testing mobile menu toggle...');
  
  // Test click event
  const clickEvent = new Event('click', { bubbles: true });
  mobileMenuToggle.dispatchEvent(clickEvent);
  
  // Test touch events
  const touchStartEvent = new TouchEvent('touchstart', { bubbles: true });
  const touchEndEvent = new TouchEvent('touchend', { bubbles: true });
  
  setTimeout(() => {
    mobileMenuToggle.dispatchEvent(touchStartEvent);
  }, 100);
  
  setTimeout(() => {
    mobileMenuToggle.dispatchEvent(touchEndEvent);
  }, 200);
  
  console.log('Mobile menu toggle events dispatched');
}

// Test 4: Check mobile menu visibility
setTimeout(() => {
  if (mobileMenu) {
    const isVisible = !mobileMenu.classList.contains('translate-y-[-100%]') && 
                     !mobileMenu.classList.contains('hidden');
    console.log('Mobile menu visibility:', isVisible ? '✅ Visible' : '❌ Hidden');
  }
}, 500);

// Test 5: Search functionality test
if (searchToggle) {
  console.log('Testing search toggle...');
  const searchClickEvent = new Event('click', { bubbles: true });
  searchToggle.dispatchEvent(searchClickEvent);
  
  setTimeout(() => {
    const searchOverlay = document.querySelector('[data-search-overlay]') || 
                         document.querySelector('.search-overlay');
    console.log('Search overlay:', searchOverlay ? '✅ Found' : '❌ Not found');
  }, 300);
}

console.log('Mobile navbar tests completed. Check the results above.');
