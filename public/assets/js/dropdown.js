// dropdown.js - Dropdown menu utilities for navigation

/**
 * Setup interactive dropdowns for navigation (click, focus, ARIA)
 * @param {string} triggerSelector - Selector for dropdown trigger links
 * @param {string} menuSelector - Selector for dropdown menus
 */
export function setupDropdowns(triggerSelector = '.nav-link[aria-haspopup="true"]', menuSelector = 'ul[role="menu"]') {
  const triggers = document.querySelectorAll(triggerSelector);
  triggers.forEach(trigger => {
    const menu = trigger.parentElement.querySelector(menuSelector);
    if (!menu) return;
    // Toggle dropdown on click
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      closeAllDropdowns();
      if (!expanded) {
        trigger.setAttribute('aria-expanded', 'true');
        menu.classList.remove('invisible', 'opacity-0');
        menu.classList.add('visible', 'opacity-100');
        trigger.focus();
      }
    });
    // Close dropdown on blur (if focus leaves menu)
    trigger.addEventListener('blur', (e) => {
      setTimeout(() => {
        if (!menu.contains(document.activeElement) && document.activeElement !== trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          menu.classList.add('invisible', 'opacity-0');
          menu.classList.remove('visible', 'opacity-100');
        }
      }, 100);
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.add('invisible', 'opacity-0');
        menu.classList.remove('visible', 'opacity-100');
      }
    });
  });
}

/**
 * Setup keyboard navigation for dropdown menus
 * @param {string} triggerSelector - Selector for dropdown trigger links
 * @param {string} menuSelector - Selector for dropdown menus
 */
export function setupDropdownKeyboardNavigation(triggerSelector = '.nav-link[aria-haspopup="true"]', menuSelector = 'ul[role="menu"]') {
  const triggers = document.querySelectorAll(triggerSelector);
  triggers.forEach(trigger => {
    const menu = trigger.parentElement.querySelector(menuSelector);
    if (!menu) return;
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.setAttribute('aria-expanded', 'true');
        menu.classList.remove('invisible', 'opacity-0');
        menu.classList.add('visible', 'opacity-100');
        const firstItem = menu.querySelector('a, button');
        if (firstItem) firstItem.focus();
      } else if (e.key === 'Escape') {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.add('invisible', 'opacity-0');
        menu.classList.remove('visible', 'opacity-100');
        trigger.focus();
      }
    });
    menu.addEventListener('keydown', (e) => {
      const items = Array.from(menu.querySelectorAll('a, button'));
      const currentIndex = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (currentIndex + 1) % items.length;
        items[next].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (currentIndex - 1 + items.length) % items.length;
        items[prev].focus();
      } else if (e.key === 'Escape') {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.add('invisible', 'opacity-0');
        menu.classList.remove('visible', 'opacity-100');
        trigger.focus();
      }
    });
  });
}

/**
 * Close all open dropdowns
 */
function closeAllDropdowns() {
  document.querySelectorAll('.nav-link[aria-haspopup="true"]').forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    const menu = trigger.parentElement.querySelector('ul[role="menu"]');
    if (menu) {
      menu.classList.add('invisible', 'opacity-0');
      menu.classList.remove('visible', 'opacity-100');
    }
  });
} 