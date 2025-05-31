// Debug script to check mobile menu hamburger functionality
console.log('=== Mobile Menu Debug ===');

// Check if elements exist
const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('nav-mobile-links');

console.log('Nav toggle element:', navToggle);
console.log('Mobile menu element:', mobileMenu);

if (navToggle) {
  console.log('✅ Nav toggle found');
  console.log('Nav toggle classes:', navToggle.className);
  console.log('Nav toggle aria-expanded:', navToggle.getAttribute('aria-expanded'));
  
  // Check if the element is visible and clickable
  const rect = navToggle.getBoundingClientRect();
  console.log('Nav toggle position and size:', {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    visible: rect.width > 0 && rect.height > 0
  });
  
  // Check computed styles
  const styles = window.getComputedStyle(navToggle);
  console.log('Nav toggle styles:', {
    display: styles.display,
    visibility: styles.visibility,
    pointerEvents: styles.pointerEvents,
    zIndex: styles.zIndex
  });
  
  // Add a test click listener
  navToggle.addEventListener('click', function(e) {
    console.log('🎯 Test click listener triggered!', e);
  });
  
  // Test manual click
  setTimeout(() => {
    console.log('Testing manual click...');
    navToggle.click();
  }, 1000);
  
} else {
  console.log('❌ Nav toggle not found');
}

if (mobileMenu) {
  console.log('✅ Mobile menu found');
  console.log('Mobile menu classes:', mobileMenu.className);
} else {
  console.log('❌ Mobile menu not found');
}

// Create a test function for manual testing
window.testMobileMenu = function() {
  console.log('🧪 Manual test function called!');
  if (mobileMenu) {
    mobileMenu.classList.toggle('open');
    console.log('Mobile menu classes after toggle:', mobileMenu.className);
  }
};

// Check if NavBarMenu class is instantiated
setTimeout(() => {
  if (window.navBarMenu) {
    console.log('✅ NavBarMenu instance found');
    console.log('NavBarMenu properties:', {
      navToggle: !!window.navBarMenu.navToggle,
      mobileMenu: !!window.navBarMenu.mobileMenu,
      isMenuOpen: window.navBarMenu.isMenuOpen
    });
  } else {
    console.log('❌ NavBarMenu instance not found');
  }
}, 2000);

console.log('=== End Debug ===');
