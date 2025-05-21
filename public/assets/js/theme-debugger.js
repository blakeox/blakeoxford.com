// theme-debugger.js
// This script helps debug theme toggle issues
// Add to your page with: <script src="/assets/js/theme-debugger.js"></script>

(function() {
  console.log('🔍 Theme Debugger Activated');
  
  // Check the current theme state
  const checkThemeState = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    console.log('📊 Theme Status:');
    console.log(`• Dark mode class on HTML: ${isDark ? '✅ Yes' : '❌ No'}`);
    console.log(`• Theme in localStorage: ${storedTheme ? storedTheme : '❌ Not set'}`);
    console.log(`• System prefers dark: ${prefersDark ? '✅ Yes' : '❌ No'}`);
    
    // Check icon visibility
    const sunIcon = document.querySelector('#theme-toggle svg.hidden.dark\\:block');
    const moonIcon = document.querySelector('#theme-toggle svg.block.dark\\:hidden');
    
    console.log('\n🌓 Icon Status:');
    console.log(`• Sun icon: ${sunIcon ? 'Found' : '❌ Not found'}`);
    if (sunIcon) {
      const display = window.getComputedStyle(sunIcon).display;
      console.log(`  - Display: ${display}`);
      console.log(`  - Should be: ${isDark ? 'block' : 'none'}`);
    }
    
    console.log(`• Moon icon: ${moonIcon ? 'Found' : '❌ Not found'}`);
    if (moonIcon) {
      const display = window.getComputedStyle(moonIcon).display;
      console.log(`  - Display: ${display}`);
      console.log(`  - Should be: ${isDark ? 'none' : 'block'}`);
    }
    
    return { isDark, storedTheme, prefersDark, sunIcon, moonIcon };
  };
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    // Initial check
    const state = checkThemeState();
    
    // Apply emergency fix if needed
    if (state.isDark) {
      document.querySelectorAll('.hidden.dark\\:block').forEach(el => {
        el.style.display = 'block';
      });
      document.querySelectorAll('.block.dark\\:hidden').forEach(el => {
        el.style.display = 'none';
      });
    }
    
    // Monitor theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      console.log('🔘 Theme toggle button found');
      themeToggle.addEventListener('click', () => {
        console.log('🖱️ Theme toggle clicked');
        // Check after a short delay to allow for DOM updates
        setTimeout(checkThemeState, 100);
      });
    } else {
      console.error('❌ Theme toggle button not found!');
    }
  });
  
  // Monitor for class changes on html element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        console.log('🔄 HTML class changed');
        checkThemeState();
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
  
  // Expose debug function globally
  window.checkThemeState = checkThemeState;
  console.log('✅ Use window.checkThemeState() in the console to run diagnostics');
})();
