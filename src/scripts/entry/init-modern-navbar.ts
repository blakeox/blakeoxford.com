// Ensures ModernNavBar is initialized on every page where the navbar exists.
import { initModernNavBar } from '../features/ModernNavBar';

declare global {
  interface Window {
    modernNavBar?: unknown;
  }
}

function initialize() {
  try {
    // Avoid duplicate initialization
    if (window.modernNavBar) return;

    const nav = document.getElementById('navbar');
    if (!nav) return; // Only init if navbar is present

    const instance = initModernNavBar();
    window.modernNavBar = instance;
  } catch (err) {
    console.error('Failed to initialize ModernNavBar:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // Small delay to ensure DOM is fully ready
  setTimeout(initialize, 0);
}
