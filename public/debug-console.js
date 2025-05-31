// Test script to check console for errors
console.log('=== HAMBURGER DEBUG SCRIPT ===');
console.log('Current URL:', window.location.href);
console.log('Document ready state:', document.readyState);

// Check if elements exist
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    setTimeout(() => {
        console.log('=== ELEMENT CHECK ===');
        const navToggle = document.getElementById('nav-toggle');
        const mobileMenu = document.getElementById('nav-mobile-links');
        
        console.log('Nav toggle found:', !!navToggle);
        console.log('Mobile menu found:', !!mobileMenu);
        
        if (navToggle) {
            console.log('Nav toggle tag:', navToggle.tagName);
            console.log('Nav toggle classes:', navToggle.className);
            console.log('Nav toggle onclick:', navToggle.onclick);
            
            const rect = navToggle.getBoundingClientRect();
            console.log('Nav toggle dimensions:', rect.width, 'x', rect.height);
            console.log('Nav toggle position:', rect.x, ',', rect.y);
            console.log('Nav toggle visible:', rect.width > 0 && rect.height > 0);
            
            // Test click programmatically
            console.log('Testing programmatic click...');
            navToggle.click();
        }
        
        console.log('=== SCRIPT CHECK ===');
        console.log('NavBarMenu loaded:', typeof window.navBarMenu);
        if (window.navBarMenu) {
            console.log('NavBarMenu instance:', window.navBarMenu);
            console.log('NavBarMenu navToggle:', window.navBarMenu.navToggle);
            console.log('NavBarMenu mobileMenu:', window.navBarMenu.mobileMenu);
        }
        
    }, 1000);
});

// Check for errors
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error, e.filename, e.lineno);
});
