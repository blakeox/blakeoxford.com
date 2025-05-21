// Simple theme toggle debugger
console.log('Theme Toggle Debugger Loaded');

function checkThemeToggleIcons() {
  // Find the theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) {
    console.error('Theme toggle button not found!');
    return;
  }
  
  // Check the sun and moon icons
  const sunIcon = themeToggle.querySelector('svg.hidden.dark\\:block');
  const moonIcon = themeToggle.querySelector('svg.block.dark\\:hidden');
  
  console.log('Theme Toggle Status:');
  console.log('- Current theme:', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  console.log('- Sun icon found:', !!sunIcon);
  console.log('- Moon icon found:', !!moonIcon);
  
  if (sunIcon && sunIcon instanceof HTMLElement) {
    console.log('- Sun icon computed style:', {
      display: getComputedStyle(sunIcon).display,
      color: getComputedStyle(sunIcon).color,
      fill: getComputedStyle(sunIcon).fill,
      visibility: getComputedStyle(sunIcon).visibility
    });
  }
  
  if (moonIcon && moonIcon instanceof HTMLElement) {
    console.log('- Moon icon computed style:', {
      display: getComputedStyle(moonIcon).display,
      color: getComputedStyle(moonIcon).color,
      fill: getComputedStyle(moonIcon).fill,
      visibility: getComputedStyle(moonIcon).visibility
    });
  }
  
  // Force visibility based on current theme
  const isDark = document.documentElement.classList.contains('dark');
  
  if (sunIcon && sunIcon instanceof HTMLElement) {
    sunIcon.style.display = isDark ? 'block' : 'none';
    if (isDark) sunIcon.style.color = '#fbbf24';
  }
  
  if (moonIcon && moonIcon instanceof HTMLElement) {
    moonIcon.style.display = isDark ? 'none' : 'block';
    if (!isDark) moonIcon.style.color = '#6b7280';
  }
  
  console.log('Applied forced icon visibility for current theme:', isDark ? 'dark' : 'light');
}

// Run when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check icons immediately
  checkThemeToggleIcons();
  
  // Set up an observer to detect theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && mutation.target === document.documentElement) {
        console.log('HTML class changed - updating icons');
        checkThemeToggleIcons();
      }
    });
  });
  
  // Start observing
  observer.observe(document.documentElement, { attributes: true });
  
  // Check after a delay to catch any lazy-loaded components
  setTimeout(checkThemeToggleIcons, 1000);
  
  // Set up a click handler on the theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      console.log('Theme toggle clicked');
      // Check after a delay to allow the theme to change
      setTimeout(checkThemeToggleIcons, 100);
    });
  }
  
  // Expose function globally for manual debugging
  window.checkThemeToggleIcons = checkThemeToggleIcons;
  console.log('Use window.checkThemeToggleIcons() to debug theme toggle icons');
});
