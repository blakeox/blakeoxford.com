/**
 * LazyBundleLoader - Progressive Enhancement System
 * Loads JavaScript bundles on demand for optimal performance
 */

class LazyBundleLoader {
  constructor() {
    this.loadedBundles = new Set();
    this.loadingPromises = new Map();
  }

  /**
   * Load a JavaScript bundle asynchronously
   */
  async loadBundle(bundleName) {
    if (this.loadedBundles.has(bundleName)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(bundleName)) {
      return this.loadingPromises.get(bundleName);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/assets/js/${bundleName}.min.js`;
      script.async = true;
      script.onload = () => {
        this.loadedBundles.add(bundleName);
        this.loadingPromises.delete(bundleName);
        resolve();
      };
      script.onerror = () => {
        this.loadingPromises.delete(bundleName);
        reject(new Error(`Failed to load bundle: ${bundleName}`));
      };
      document.head.appendChild(script);
    });

    this.loadingPromises.set(bundleName, promise);
    return promise;
  }

  /**
   * Load external libraries with caching
   */
  async loadExternalLibrary(libName, url) {
    if (this.loadedBundles.has(libName)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(libName)) {
      return this.loadingPromises.get(libName);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        this.loadedBundles.add(libName);
        this.loadingPromises.delete(libName);
        resolve();
      };
      script.onerror = () => {
        this.loadingPromises.delete(libName);
        reject(new Error(`Failed to load library: ${libName}`));
      };
      document.head.appendChild(script);
    });

    this.loadingPromises.set(libName, promise);
    return promise;
  }

  /**
   * Load accessibility features on user interaction
   */
  async loadAccessibilityFeatures() {
    return this.loadBundle('accessibility');
  }

  /**
   * Load interactive features including search
   */
  async loadInteractiveFeatures() {
    await Promise.all([
      this.loadBundle('interactive'),
      this.loadExternalLibrary('fuse', 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js')
    ]);
  }

  /**
   * Load form validation features
   */
  async loadFormFeatures() {
    return this.loadBundle('forms');
  }
}

// Initialize global loader
window.LazyBundleLoader = new LazyBundleLoader();

/**
 * Load accessibility features on first user interaction
 */
const loadA11yOnInteraction = () => {
  const events = ['keydown', 'click', 'focus'];
  const loadOnce = () => {
    window.LazyBundleLoader.loadAccessibilityFeatures();
    events.forEach(event => {
      document.removeEventListener(event, loadOnce, true);
    });
  };
  
  events.forEach(event => {
    document.addEventListener(event, loadOnce, true);
  });

  // Load immediately if user has accessibility preferences
  if (localStorage.getItem('accessibility-preferences')) {
    loadOnce();
  }
};

/**
 * Initialize progressive loading
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Load interactive features after a short delay
    setTimeout(() => window.LazyBundleLoader.loadInteractiveFeatures(), 100);
  });
} else {
  // DOM already loaded
  setTimeout(() => window.LazyBundleLoader.loadInteractiveFeatures(), 100);
}

// Set up accessibility loading
loadA11yOnInteraction();
