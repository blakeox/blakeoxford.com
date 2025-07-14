// Debug script to test search overlay functionality
console.log('=== SEARCH OVERLAY DEBUG ===');

// Check if search overlay exists
const searchOverlay = document.getElementById('search-overlay');
console.log('Search overlay element:', searchOverlay);

// Check if SearchOverlay class is available
console.log('SearchOverlay in window:', window.SearchOverlay);
console.log('searchOverlay instance in window:', window.searchOverlay);

// Check if interactive bundle is loaded
console.log('Interactive bundle scripts loaded:');
const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
console.log(scripts.filter(src => src.includes('interactive') || src.includes('lazy-loader')));

// Try to manually trigger search overlay
if (searchOverlay) {
  console.log('Search overlay current style:', {
    display: searchOverlay.style.display,
    opacity: getComputedStyle(searchOverlay).opacity,
    visibility: getComputedStyle(searchOverlay).visibility
  });
}

// Check if there are any JavaScript errors
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
});

// Try manual keyboard event
console.log('Testing manual Control+K event...');
document.dispatchEvent(new KeyboardEvent('keydown', {
  key: 'k',
  ctrlKey: true,
  bubbles: true
}));

setTimeout(() => {
  if (searchOverlay) {
    console.log('Search overlay after manual trigger:', {
      display: searchOverlay.style.display,
      opacity: getComputedStyle(searchOverlay).opacity,
      visibility: getComputedStyle(searchOverlay).visibility
    });
  }
}, 1000);
