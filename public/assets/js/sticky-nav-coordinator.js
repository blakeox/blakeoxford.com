// sticky-nav-coordinator.js - Coordinates sticky nav pillbar with navbar state
// This script handles the coordination between the main navbar and sticky nav pillbar

/**
 * Sticky Nav Pillbar Coordinator
 * Listens for navbar state changes and updates pillbar positioning accordingly
 */
class StickyNavCoordinator {
  constructor() {
    this.stickyNav = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.stickyNav = document.getElementById('sticky-nav');
    if (!this.stickyNav) {
      console.log('StickyNavCoordinator: No sticky nav found on this page');
      return;
    }

    console.log('StickyNavCoordinator: Setting up sticky nav coordination');
    
    // Listen for navbar state changes
    this.setupNavbarStateListener();
    
    // Wait for NavBarMenu to be ready, then check initial state
    if (window.navBarMenu && window.updateNavbarState) {
      this.updateFromCurrentState();
    } else {
      // Wait for NavBarMenu to initialize
      console.log('StickyNavCoordinator: Waiting for NavBarMenu initialization...');
      const checkNavBarMenu = () => {
        if (window.navBarMenu && window.updateNavbarState) {
          console.log('StickyNavCoordinator: NavBarMenu ready, updating from current state');
          this.updateFromCurrentState();
        } else {
          setTimeout(checkNavBarMenu, 100);
        }
      };
      setTimeout(checkNavBarMenu, 100);
    }
    
    // Setup intersection observer for smooth scrolling effects
    this.setupIntersectionObserver();
    
    // Setup click handlers for smooth scrolling
    this.setupSmoothScrolling();
  }

  setupNavbarStateListener() {
    // Listen for custom navbar state change events
    document.addEventListener('navbarStateChange', (event) => {
      const { isHidden } = event.detail;
      this.updateStickyNavPosition(isHidden);
    });

    // Also listen for changes to the data attribute (fallback)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-navbar-state') {
          const isHidden = document.documentElement.getAttribute('data-navbar-state') === 'hidden';
          this.updateStickyNavPosition(isHidden);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-navbar-state']
    });
  }

  updateFromCurrentState() {
    // Check current navbar state from data attribute
    const currentState = document.documentElement.getAttribute('data-navbar-state');
    const isHidden = currentState === 'hidden';
    this.updateStickyNavPosition(isHidden);
  }

  updateStickyNavPosition(isHidden) {
    if (!this.stickyNav) return;

    console.log(`StickyNavCoordinator: Updating position - navbar ${isHidden ? 'hidden' : 'visible'}`);
    
    // Add custom classes for additional styling coordination
    if (isHidden) {
      this.stickyNav.classList.add('navbar-hidden');
      this.stickyNav.classList.remove('navbar-visible');
    } else {
      this.stickyNav.classList.add('navbar-visible');
      this.stickyNav.classList.remove('navbar-hidden');
    }

    // Announce the change for screen readers (optional)
    this.announceNavbarStateChange(isHidden);
  }

  announceNavbarStateChange(isHidden) {
    // Create a live region announcement for accessibility
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigation ${isHidden ? 'minimized' : 'restored'}`;
    
    document.body.appendChild(announcement);
    
    // Remove the announcement after a short delay
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  setupIntersectionObserver() {
    // Create intersection observer to highlight active sections
    const sections = document.querySelectorAll('[id^="about-"], [id^="achievements"], [id^="education-"], [id^="testimonials"], [id^="about-social"]');
    const navLinks = this.stickyNav.querySelectorAll('.sticky-nav-pill');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Remove active class from all nav links
          navLinks.forEach(link => link.classList.remove('active'));
          
          // Add active class to corresponding nav link
          const targetId = entry.target.id;
          const correspondingLink = this.stickyNav.querySelector(`a[href="#${targetId}"]`);
          if (correspondingLink) {
            correspondingLink.classList.add('active');
          }
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }

  setupSmoothScrolling() {
    const navLinks = this.stickyNav.querySelectorAll('.sticky-nav-pill');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          // Calculate offset accounting for navbar height
          const navbarHeight = 80; // Default navbar height
          const stickyNavHeight = this.stickyNav.offsetHeight + 20; // Add some padding
          const offset = navbarHeight + stickyNavHeight;
          
          const targetPosition = targetElement.offsetTop - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update active state immediately for better UX
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });
  }
}

// Initialize the coordinator
const stickyNavCoordinator = new StickyNavCoordinator();

// Export for potential external use
window.stickyNavCoordinator = stickyNavCoordinator;
