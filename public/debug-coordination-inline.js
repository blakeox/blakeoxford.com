// Add this script to about page for real-time coordination debugging
(function() {
    console.log('🔍 Starting coordination diagnostic...');
    
    // Check for required elements
    const navbar = document.querySelector('[data-navbar]');
    const stickyNav = document.getElementById('sticky-nav');
    
    console.log('📍 Navbar found:', !!navbar);
    console.log('📍 Sticky nav found:', !!stickyNav);
    
    if (!navbar) {
        console.error('❌ Navbar not found - coordination cannot work');
        return;
    }
    
    if (!stickyNav) {
        console.error('❌ Sticky nav not found - coordination cannot work');
        return;
    }
    
    // Check current state
    const currentState = document.documentElement.getAttribute('data-navbar-state');
    console.log('📊 Current navbar state:', currentState);
    
    // Check computed styles
    const stickyNavStyle = window.getComputedStyle(stickyNav);
    console.log('📐 Sticky nav computed styles:');
    console.log('  position:', stickyNavStyle.position);
    console.log('  top:', stickyNavStyle.top);
    console.log('  transform:', stickyNavStyle.transform);
    
    // Monitor state changes
    document.addEventListener('navbarStateChange', (event) => {
        console.log('🔄 Navbar state change detected:', event.detail);
        setTimeout(() => {
            const newStyle = window.getComputedStyle(stickyNav);
            console.log('📐 Sticky nav styles after change:');
            console.log('  top:', newStyle.top);
            console.log('  classes:', Array.from(stickyNav.classList).join(', '));
        }, 100);
    });
    
    // Test functions
    window.testCoordination = {
        hideNavbar: () => {
            console.log('🧪 Testing navbar hide...');
            if (window.updateNavbarState) {
                window.updateNavbarState(true);
            } else {
                console.error('❌ updateNavbarState not available');
            }
        },
        showNavbar: () => {
            console.log('🧪 Testing navbar show...');
            if (window.updateNavbarState) {
                window.updateNavbarState(false);
            } else {
                console.error('❌ updateNavbarState not available');
            }
        },
        checkState: () => {
            const state = document.documentElement.getAttribute('data-navbar-state');
            const stickyTop = window.getComputedStyle(stickyNav).top;
            const stickyClasses = Array.from(stickyNav.classList);
            console.log('📊 Current State Check:');
            console.log('  Navbar state:', state);
            console.log('  Sticky nav top:', stickyTop);
            console.log('  Sticky nav classes:', stickyClasses);
        }
    };
    
    console.log('✅ Coordination diagnostic complete. Use window.testCoordination to test:');
    console.log('  - testCoordination.hideNavbar()');
    console.log('  - testCoordination.showNavbar()'); 
    console.log('  - testCoordination.checkState()');
})();
