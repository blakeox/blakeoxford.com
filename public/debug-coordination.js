// Debug script for navbar-sticky nav coordination
// Run this in browser console to check coordination state

console.log('=== Navbar-Sticky Nav Coordination Debug ===');

// Check if elements exist
const navbar = document.querySelector('[data-navbar]') || document.querySelector('nav.navbar') || document.querySelector('#navbar');
const stickyNav = document.getElementById('sticky-nav');

console.log('Navbar element:', navbar);
console.log('Sticky nav element:', stickyNav);

// Check current navbar state
const navbarState = document.documentElement.getAttribute('data-navbar-state');
console.log('Current navbar state:', navbarState);

// Check sticky nav position and classes
if (stickyNav) {
    const stickyNavStyle = window.getComputedStyle(stickyNav);
    console.log('Sticky nav computed style:');
    console.log('  position:', stickyNavStyle.position);
    console.log('  top:', stickyNavStyle.top);
    console.log('  transform:', stickyNavStyle.transform);
    console.log('  classes:', Array.from(stickyNav.classList).join(', '));
    
    // Check bounding rect
    const rect = stickyNav.getBoundingClientRect();
    console.log('Sticky nav position (getBoundingClientRect):');
    console.log('  top:', rect.top, 'px');
    console.log('  left:', rect.left, 'px');
    console.log('  width:', rect.width, 'px');
    console.log('  height:', rect.height, 'px');
}

// Test navbar state change
console.log('\n=== Testing Navbar State Management ===');

if (window.updateNavbarState) {
    console.log('Testing navbar hide...');
    window.updateNavbarState(true);
    
    setTimeout(() => {
        console.log('State after hiding:', document.documentElement.getAttribute('data-navbar-state'));
        if (stickyNav) {
            console.log('Sticky nav classes after hiding:', Array.from(stickyNav.classList).join(', '));
            console.log('Sticky nav top after hiding:', window.getComputedStyle(stickyNav).top);
        }
        
        console.log('Testing navbar show...');
        window.updateNavbarState(false);
        
        setTimeout(() => {
            console.log('State after showing:', document.documentElement.getAttribute('data-navbar-state'));
            if (stickyNav) {
                console.log('Sticky nav classes after showing:', Array.from(stickyNav.classList).join(', '));
                console.log('Sticky nav top after showing:', window.getComputedStyle(stickyNav).top);
            }
        }, 500);
    }, 500);
} else {
    console.log('window.updateNavbarState not available');
}

// Listen for navbar state changes
document.addEventListener('navbarStateChange', (event) => {
    console.log('Navbar state change event:', event.detail);
});

console.log('\n=== Scroll to test automatic coordination ===');
console.log('Scroll down to hide navbar, scroll up to show it');
console.log('Watch the sticky nav position change accordingly');
