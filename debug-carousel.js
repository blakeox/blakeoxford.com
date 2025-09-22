/* eslint-env browser */
/* global window, document, getComputedStyle, console */
// Debug script to check carousel responsiveness
// Run this in the browser console to see which elements are visible

function debugCarousel() {
  console.log('=== PhotoCarousel Debug ===');

  const horizontal = document.querySelector('ul.animate-carousel-x-slow');
  const upCol = document.querySelector('ul.animate-carousel-up-slow');
  const downCol = document.querySelector('ul.animate-carousel-down-slow');

  console.log('Window width:', window.innerWidth);
  console.log('Window height:', window.innerHeight);

  console.log('\nHorizontal carousel (mobile/tablet):');
  console.log('- Element found:', !!horizontal);
  if (horizontal) {
    const styles = getComputedStyle(horizontal);
    console.log('- Display:', styles.display);
    console.log('- Visibility:', styles.visibility);
    console.log('- Opacity:', styles.opacity);
    console.log('- Parent container display:', getComputedStyle(horizontal.parentElement).display);
    console.log('- Parent container classes:', horizontal.parentElement.className);
  }

  console.log('\nVertical up column (desktop):');
  console.log('- Element found:', !!upCol);
  if (upCol) {
    const styles = getComputedStyle(upCol);
    console.log('- Display:', styles.display);
    console.log('- Visibility:', styles.visibility);
    console.log('- Opacity:', styles.opacity);
    console.log('- Parent container display:', getComputedStyle(upCol.parentElement).display);
    console.log('- Parent container classes:', upCol.parentElement.className);
  }

  console.log('\nVertical down column (desktop):');
  console.log('- Element found:', !!downCol);
  if (downCol) {
    const styles = getComputedStyle(downCol);
    console.log('- Display:', styles.display);
    console.log('- Visibility:', styles.visibility);
    console.log('- Opacity:', styles.opacity);
  }

  // Check Tailwind breakpoint classes
  console.log('\n=== Tailwind Breakpoint Check ===');
  const testEl = document.createElement('div');
  testEl.className = 'lg:hidden';
  document.body.appendChild(testEl);
  const lgHiddenDisplay = getComputedStyle(testEl).display;
  testEl.className = 'hidden lg:flex';
  const hiddenLgFlexDisplay = getComputedStyle(testEl).display;
  document.body.removeChild(testEl);

  console.log('lg:hidden test element display:', lgHiddenDisplay);
  console.log('hidden lg:flex test element display:', hiddenLgFlexDisplay);

  // Check media query
  const lgMediaQuery = window.matchMedia('(min-width: 1024px)');
  console.log('lg breakpoint (min-width: 1024px) matches:', lgMediaQuery.matches);
}

// Auto-run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debugCarousel);
} else {
  debugCarousel();
}

// Also provide manual trigger
window.debugCarousel = debugCarousel;

console.log('Debug script loaded. Run debugCarousel() in console or it will auto-run.');
