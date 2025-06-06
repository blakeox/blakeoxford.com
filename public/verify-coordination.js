// Final verification script for navbar-sticky nav coordination
// Run this in browser console to verify everything is working

console.log('🎯 Final Coordination Verification Test');
console.log('=====================================');

// 1. Check all required elements
const navbar = document.querySelector('[data-navbar]');
const stickyNav = document.getElementById('sticky-nav');

console.log('✅ Elements found:');
console.log('  - Navbar:', !!navbar);
console.log('  - Sticky Nav:', !!stickyNav);

if (!navbar || !stickyNav) {
    console.error('❌ Required elements missing - coordination cannot work');
} else {
    console.log('✅ All required elements found');
}

// 2. Check script loading
console.log('\n✅ Scripts loaded:');
console.log('  - NavBarMenu:', !!window.navBarMenu);
console.log('  - StickyNavCoordinator:', !!window.stickyNavCoordinator);
console.log('  - updateNavbarState:', !!window.updateNavbarState);

// 3. Check initial state
const initialState = document.documentElement.getAttribute('data-navbar-state');
console.log('\n📊 Initial state:', initialState);

if (stickyNav) {
    const initialStyle = window.getComputedStyle(stickyNav);
    console.log('📐 Initial sticky nav position:', initialStyle.top);
    console.log('📝 Initial sticky nav classes:', Array.from(stickyNav.classList).join(', '));
}

// 4. Test coordination
console.log('\n🧪 Testing coordination...');

function testSequence() {
    return new Promise((resolve) => {
        console.log('  Step 1: Hide navbar');
        window.updateNavbarState(true);
        
        setTimeout(() => {
            const hiddenState = document.documentElement.getAttribute('data-navbar-state');
            const hiddenStyle = window.getComputedStyle(stickyNav);
            console.log('    Hidden state:', hiddenState);
            console.log('    Hidden sticky nav top:', hiddenStyle.top);
            console.log('    Hidden sticky nav classes:', Array.from(stickyNav.classList).join(', '));
            
            console.log('  Step 2: Show navbar');
            window.updateNavbarState(false);
            
            setTimeout(() => {
                const visibleState = document.documentElement.getAttribute('data-navbar-state');
                const visibleStyle = window.getComputedStyle(stickyNav);
                console.log('    Visible state:', visibleState);
                console.log('    Visible sticky nav top:', visibleStyle.top);
                console.log('    Visible sticky nav classes:', Array.from(stickyNav.classList).join(', '));
                
                resolve();
            }, 500);
        }, 500);
    });
}

if (window.updateNavbarState && stickyNav) {
    testSequence().then(() => {
        console.log('\n🎉 Coordination test complete!');
        console.log('✅ Expected behavior:');
        console.log('  - When navbar hidden: sticky nav top should be ~1.5rem');
        console.log('  - When navbar visible: sticky nav top should be ~6rem');
        console.log('  - Classes should toggle between navbar-hidden/navbar-visible');
        console.log('\n🎮 Manual test: Scroll down and up to see automatic coordination');
    });
} else {
    console.error('❌ Cannot run test - required functions/elements missing');
}

// 5. Event monitoring
document.addEventListener('navbarStateChange', (event) => {
    console.log('🔔 Navbar state change event:', event.detail);
});

console.log('\n📝 Monitoring navbar state changes...');
