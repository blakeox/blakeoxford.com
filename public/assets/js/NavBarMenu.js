// NavBarMenu.js: Handles all navigation logic for NavBar.astro
// Hydrates nav links, handles mobile toggle, accessibility, and keyboard shortcuts

/**
 * Navigation link data structure
 * @typedef {Object} NavLink
 * @property {string} href - URL path
 * @property {string} label - Display text
 * @property {string} analytics - Data attribute for analytics tracking
 * @property {boolean} [external] - Whether this is an external link
 * @property {string} [target] - Target attribute for link (_blank, _self, etc.)
 * @property {NavLink[]} [children] - Child links for dropdown menus
 */

/**
 * Navigation links configuration
 * @type {NavLink[]}
 */
const navLinksData = [
  { href: '/', label: 'Home', analytics: 'nav-home' },
  { href: '/about/', label: 'About', analytics: 'nav-about' },
  { 
    href: '/projects/', 
    label: 'Projects', 
    analytics: 'nav-projects',
    // Example of dropdown menu:
    // children: [
    //   { href: '/projects/web/', label: 'Web Projects', analytics: 'nav-projects-web' },
    //   { href: '/projects/design/', label: 'Design Work', analytics: 'nav-projects-design' },
    //   { href: '/projects/open-source/', label: 'Open Source', analytics: 'nav-projects-opensource' },
    // ]
  },
  { href: '/blog/', label: 'Blog', analytics: 'nav-blog' },
  { href: '/contact/', label: 'Contact', analytics: 'nav-contact' },
  // Social media links - uncomment and customize as needed
  // { href: 'https://github.com/yourusername', label: 'GitHub', analytics: 'nav-github', external: true, target: '_blank' },
  // { href: 'https://linkedin.com/in/yourusername', label: 'LinkedIn', analytics: 'nav-linkedin', external: true, target: '_blank' },
  // { href: 'https://twitter.com/yourusername', label: 'Twitter', analytics: 'nav-twitter', external: true, target: '_blank' },
];

/**
 * Create a navigation link element 
 * @param {NavLink} link - Navigation link data
 * @param {boolean} isMobile - Whether this link is for mobile navigation
 * @returns {HTMLAnchorElement} - The created anchor element
 */
function createNavLink(link, isMobile = false) {
  const a = document.createElement('a');
  a.href = link.href;
  a.textContent = link.label;
  a.dataset.analytics = link.analytics;
  
  // Handle external links
  if (link.external) {
    // Add target attribute if specified
    if (link.target) {
      a.target = link.target;
    }
    
    // Add rel="noopener" for security when target="_blank"
    if (link.target === '_blank') {
      a.rel = 'noopener noreferrer';
    }
    
    // Add external link indicator
    const externalIcon = document.createElement('span');
    externalIcon.className = 'external-link-icon ml-1 inline-block text-xs';
    externalIcon.innerHTML = '↗'; // Simple external link icon
    externalIcon.setAttribute('aria-hidden', 'true');
    a.appendChild(externalIcon);
  }
  
  // Add relevant ARIA attributes
  a.setAttribute('role', 'menuitem');
  
  // Different styling for mobile vs desktop navigation
  a.className = isMobile
    ? 'block text-foreground font-medium hover:text-accent focus:text-accent transition-colors duration-200 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent focus:bg-accent/10 aria-[current=page]:font-bold aria-[current=page]:text-accent'
    : 'text-navbar-text dark:text-navbar-textDark font-medium hover:bg-navbar-hoverBackground dark:hover:bg-navbar-hoverBackgroundDark transition-all duration-200 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-navbar-text dark:focus:ring-navbar-textDark aria-[current=page]:font-bold aria-[current=page]:text-navbar-activeText';
  
  return a;
}

/**
 * Create a dropdown menu for navigation
 * @param {NavLink[]} children - Child links for the dropdown
 * @param {boolean} isMobile - Whether this dropdown is for mobile navigation
 * @returns {HTMLElement} - The created dropdown element
 */
function createDropdown(children, isMobile = false) {
  const dropdown = document.createElement('div');
  dropdown.className = isMobile
    ? 'pl-4 mt-1 space-y-1'
    : 'absolute z-10 bg-navbar-background dark:bg-navbar-backgroundDark shadow-lg rounded-md overflow-hidden mt-1 py-1 min-w-[200px] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200';
  dropdown.setAttribute('role', 'menu');
  
  // Create dropdown items
  children.forEach(childLink => {
    const childItem = document.createElement('div');
    childItem.setAttribute('role', 'none');
    
    const childA = createNavLink(childLink, isMobile);
    childA.className = isMobile
      ? 'block text-foreground font-medium hover:text-accent focus:text-accent transition-colors duration-200 py-1 px-3 rounded focus:outline-none focus:ring-2 focus:ring-accent'
      : 'block px-4 py-2 text-sm text-navbar-text dark:text-navbar-textDark hover:bg-navbar-hoverBackground dark:hover:bg-navbar-hoverBackgroundDark transition-colors focus:outline-none focus:bg-navbar-hoverBackground dark:focus:bg-navbar-hoverBackgroundDark';
    
    childItem.appendChild(childA);
    dropdown.appendChild(childItem);
  });
  
  return dropdown;
}

/**
 * Hydrate navigation links in both desktop and mobile menus
 */
function hydrateNavLinks() {
  const navLinks = document.getElementById('nav-links');
  const navMobileLinks = document.getElementById('nav-mobile-links');
  
  if (!navLinks || !navMobileLinks) {
    console.warn('Navigation elements not found. Navigation links cannot be hydrated.');
    return;
  }
  
  // Clear existing content
  navLinks.innerHTML = '';
  navMobileLinks.innerHTML = '';
  
  // Add desktop navigation links
  navLinksData.forEach(link => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none'); // For proper ARIA menu structure
    
    // Add group class for dropdown hover state if link has children
    if (link.children && link.children.length > 0) {
      li.className = 'group relative';
    }
    
    const a = createNavLink(link);
    
    // Add dropdown indicator if link has children
    if (link.children && link.children.length > 0) {
      a.className += ' inline-flex items-center';
      
      const dropdownIndicator = document.createElement('span');
      dropdownIndicator.className = 'ml-1 text-xs';
      dropdownIndicator.innerHTML = '▼';
      dropdownIndicator.setAttribute('aria-hidden', 'true');
      a.appendChild(dropdownIndicator);
      
      // Add appropriate ARIA attributes for dropdown
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');
      
      // Create dropdown menu
      const dropdown = createDropdown(link.children);
      
      // Append link and dropdown to list item
      li.appendChild(a);
      li.appendChild(dropdown);
    } else {
      // Append just the link for regular menu items
      li.appendChild(a);
    }
    
    navLinks.appendChild(li);
  });
  
  // Add separator for mobile navigation
  navMobileLinks.appendChild(document.createElement('hr'));
  
  // Add mobile navigation links
  navLinksData.forEach(link => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none'); // For proper ARIA menu structure
    
    const a = createNavLink(link, true);
    li.appendChild(a);
    
    // Add dropdown for mobile if link has children
    if (link.children && link.children.length > 0) {
      // Add dropdown toggle button
      const toggleButton = document.createElement('button');
      toggleButton.className = 'ml-2 p-1 text-xs';
      toggleButton.innerHTML = '▼';
      toggleButton.setAttribute('aria-label', `Toggle ${link.label} submenu`);
      toggleButton.setAttribute('aria-expanded', 'false');
      
      // Create dropdown content (initially hidden)
      const dropdown = createDropdown(link.children, true);
      dropdown.classList.add('hidden');
      
      // Toggle dropdown visibility on button click
      toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        
        // Toggle dropdown visibility
        dropdown.classList.toggle('hidden');
        
        // Rotate indicator
        toggleButton.style.transform = isExpanded ? '' : 'rotate(180deg)';
      });
      
      li.appendChild(toggleButton);
      li.appendChild(dropdown);
    }
    
    navMobileLinks.appendChild(li);
  });
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Add a skip to content link for accessibility
 */
function addSkipToContentLink() {
  // Check if a skip link already exists
  if (document.getElementById('skip-to-content')) {
    return;
  }
  
  const skipLink = document.createElement('a');
  skipLink.id = 'skip-to-content';
  skipLink.href = '#main';  // Should target the main content area
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-accent';
  
  // Add as the first element in the body
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Track navigation events via analytics
 * @param {string} eventName - Name of the event to track
 * @param {Object} eventData - Additional data to send with the event
 */
function trackNavigationEvent(eventName, eventData = {}) {
  // Check if analytics is available (e.g., Google Analytics, Plausible, Fathom, etc.)
  if (typeof gtag === 'function') {
    // Google Analytics
    gtag('event', eventName, eventData);
  } else if (typeof plausible === 'function') {
    // Plausible Analytics
    plausible(eventName, { props: eventData });
  } else if (typeof fathom === 'object' && typeof fathom.trackEvent === 'function') {
    // Fathom Analytics
    fathom.trackEvent(eventName, eventData);
  } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
    // Google Tag Manager
    window.dataLayer.push({
      'event': eventName,
      ...eventData
    });
  } else {
    // Analytics not detected, you could log the event to console for debugging
    console.debug('[Analytics]', eventName, eventData);
  }
}

/**
 * Main initialization function
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Add skip to content link
    addSkipToContentLink();
    
    hydrateNavLinks();

    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-mobile-links');
    const searchToggle = document.getElementById('search-toggle');
    
    // Check if critical elements exist
    if (!navToggle) {
      console.warn('Navigation toggle button not found.');
    }
    
    if (!navLinks) {
      console.warn('Mobile navigation links container not found.');
    }

    /**
     * Toggle tabindex for keyboard accessibility
     * @param {boolean} isActive - Whether the mobile menu is active
     */
    function toggleTabIndex(isActive) {
      if (!navLinks) return;
      
      navLinks.querySelectorAll('a').forEach((link) => {
        link.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    /**
     * Toggle mobile navigation menu visibility
     */
    function toggleNav() {
      if (!navToggle || !navLinks) return;
      
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      const newExpandedState = !isExpanded;
      
      // Update ARIA state
      navToggle.setAttribute('aria-expanded', String(newExpandedState));
      
      // Lazy load mobile menu content on first open
      if (newExpandedState && !navLinks.dataset.loaded) {
        // Load mobile navigation links dynamically
        navLinks.querySelectorAll('.lazy-load-item').forEach(item => {
          // Replace placeholder with actual content
          if (item.dataset.src) {
            const img = document.createElement('img');
            img.src = item.dataset.src;
            img.alt = item.dataset.alt || '';
            img.className = item.className;
            item.parentNode.replaceChild(img, item);
          }
          
          // Mark additional content for loading
          item.classList.remove('lazy-load-item');
        });
        
        navLinks.dataset.loaded = 'true';
      }
      
      // Toggle CSS classes
      navLinks.classList.toggle('c-navbar__links--active', newExpandedState);
      navLinks.classList.toggle('hidden', !newExpandedState);
      
      // Toggle icon visibility
      const closeIcon = navToggle.querySelector('.close-icon');
      const menuIcon = navToggle.querySelector('.menu-icon');
      
      if (closeIcon && menuIcon) {
        closeIcon.classList.toggle('hidden', !newExpandedState);
        menuIcon.classList.toggle('hidden', newExpandedState);
      }
      
      // Update tab index for keyboard accessibility
      toggleTabIndex(newExpandedState);
    }

    /**
     * Close mobile navigation menu
     */
    function closeNav() {
      if (!navToggle || !navLinks) return;
      
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('c-navbar__links--active');
      navLinks.classList.add('hidden');
      
      const closeIcon = navToggle.querySelector('.close-icon');
      const menuIcon = navToggle.querySelector('.menu-icon');
      
      if (closeIcon && menuIcon) {
        closeIcon.classList.add('hidden');
        menuIcon.classList.remove('hidden');
      }
      
      toggleTabIndex(false);
    }

    /**
     * Highlight the active navigation link based on current URL path
     */
    function highlightActiveLink() {
      const currentPath = window.location.pathname;
      
      document.querySelectorAll('#nav-links a, #nav-mobile-links a').forEach((link) => {
        // Check if the link href matches the current path
        const href = link.getAttribute('href') || '';
        const isActive = href === currentPath || 
                         // Handle index page case
                         (currentPath === '/' && href === '/') ||
                         // Handle section paths (e.g. /blog/post-1 should highlight /blog/)
                         (href !== '/' && currentPath.startsWith(href));
        
        // Add/remove active class
        link.classList.toggle('active', isActive);
        
        // Update ARIA attribute
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    /**
     * Handle keyboard shortcuts for navigation
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handleKeyboardShortcuts(event) {
      // Search shortcut
      if (event.key === '/' && 
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        event.preventDefault();
        
        if (searchToggle) {
          searchToggle.click();
        } else {
          console.warn('Search toggle button not found. "/" shortcut not functional.');
        }
      }
    }

    // Initialize navigation functionality if required elements exist
    if (navToggle && navLinks) {
      // Set appropriate ARIA roles
      navLinks.setAttribute('role', 'menu');
      
      // Toggle menu when button is clicked
      navToggle.addEventListener('click', toggleNav);
      
      // Handle keyboard navigation for the toggle button
      navToggle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleNav();
        }
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (event) => {
        if (!navLinks.contains(event.target) && !navToggle.contains(event.target)) {
          closeNav();
        }
      });
      
      // Close menu when pressing Escape
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeNav();
        }
      });
      
      // Close menu when a link is clicked
      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          closeNav();
        });
      });
      
      // Handle responsive behavior
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          // Close mobile menu on larger screens
          if (window.innerWidth > 768) {
            closeNav();
            toggleTabIndex(false);
          }
        }, 200);
      });
    }
    
    // Add global keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Add click event listeners for analytics tracking
    document.querySelectorAll('a[data-analytics]').forEach(link => {
      link.addEventListener('click', (e) => {
        const analyticsId = link.dataset.analytics;
        if (analyticsId) {
          trackNavigationEvent('navigation_click', { 
            id: analyticsId,
            url: link.href,
            text: link.textContent.trim()
          });
        }
      });
    });

    // Initialize active link highlighting
    highlightActiveLink();
    
    // Make search toggle interactive if it exists
    const searchToggleElement = document.querySelector('.search-toggle');
    if (searchToggleElement) {
      searchToggleElement.removeAttribute('inert');
    }
    
    // Add page transition support
    setupPageTransitions();
    
    // Setup automatic hiding/showing of navbar on scroll (optional)
    setupScrollBehavior();
  } catch (error) {
    console.error('Error initializing navigation:', error);
  }
});

/**
 * Setup smooth page transitions
 */
function setupPageTransitions() {
  // Only setup if browser supports the Navigation API
  if (!('navigation' in window)) return;

  // Create progress indicator element
  const progressIndicator = document.createElement('div');
  progressIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-transparent z-50';
  progressIndicator.id = 'page-transition-progress';
  document.body.appendChild(progressIndicator);

  // Get all internal links
  const internalLinks = document.querySelectorAll('a[href^="/"]:not([target="_blank"])');
  
  internalLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      // Skip if modifier keys are pressed (user wants to open in new tab, etc.)
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      
      const href = link.getAttribute('href');
      
      // Skip for download links, anchor links, or external links
      if (link.hasAttribute('download') || 
          href.includes('#') || 
          link.hasAttribute('target')) return;
      
      // Prevent default navigation
      event.preventDefault();
      
      // Add a class to the body to trigger exit animation
      document.body.classList.add('page-transition-exit');
      
      // Show and animate the progress indicator
      const indicator = document.getElementById('page-transition-progress');
      if (indicator) {
        indicator.style.background = 'linear-gradient(to right, var(--color-accent) 0%, var(--color-accent-light) 50%, var(--color-accent) 100%)';
        indicator.style.width = '0%';
        indicator.style.opacity = '1';
        
        // Animate to 60% quickly, then slow down
        setTimeout(() => { indicator.style.width = '60%'; indicator.style.transition = 'width 150ms ease-out'; }, 10);
        setTimeout(() => { indicator.style.width = '80%'; indicator.style.transition = 'width 800ms ease-out'; }, 150);
      }
      
      // Wait for animation to complete before navigating
      setTimeout(() => {
        window.location.href = href;
      }, 250); // Match this to your CSS transition duration
    });
  });
  
  // When page loads, add entrance animation class and complete the progress bar
  window.addEventListener('pageshow', () => {
    document.body.classList.add('page-transition-enter');
    
    // Complete and fade out the progress indicator
    const indicator = document.getElementById('page-transition-progress');
    if (indicator) {
      indicator.style.width = '100%';
      indicator.style.transition = 'width 200ms ease-out';
      
      setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 300ms ease-out';
      }, 200);
    }
    
    // Remove the class after animation completes
    setTimeout(() => {
      document.body.classList.remove('page-transition-enter');
    }, 300); // Match this to your CSS transition duration
  });
}

/**
 * Setup navbar scroll behavior (hide on scroll down, show on scroll up)
 */
function setupScrollBehavior() {
  let lastScrollTop = 0;
  const navbar = document.querySelector('nav');
  const scrollThreshold = 50; // Minimum scroll amount before hiding/showing
  
  if (!navbar) return;
  
  const handleScroll = debounce(() => {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    
    // Skip small movements
    if (Math.abs(lastScrollTop - currentScroll) < scrollThreshold) return;
    
    // Add a class instead of directly manipulating style for better performance
    if (currentScroll > lastScrollTop && currentScroll > 100) {
      // Scrolling down & not at the top
      navbar.classList.add('nav-hidden');
      navbar.classList.remove('nav-visible');
    } else {
      // Scrolling up or at the top
      navbar.classList.add('nav-visible');
      navbar.classList.remove('nav-hidden');
    }
    
    lastScrollTop = currentScroll;
  }, 50); // 50ms debounce
  
  window.addEventListener('scroll', handleScroll, { passive: true }); // Better performance for scroll events
}
