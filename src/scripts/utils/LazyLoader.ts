/**
 * Modern LazyBundleLoader - TypeScript Version
 * Progressive Enhancement System for loading JavaScript bundles on demand
 */

export interface LazyLoaderConfig {
  basePath?: string;
  enableLogging?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface LoadOptions {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export class LazyBundleLoader {
  private loadedBundles: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private modulesLoaded: Set<string> = new Set();
  private config: Required<LazyLoaderConfig>;

  constructor(config: LazyLoaderConfig = {}) {
    this.config = {
      basePath: '/assets/js/',
      enableLogging: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Load a JavaScript bundle asynchronously
   */
  async loadBundle(bundleName: string, options: LoadOptions = {}): Promise<void> {
    if (this.loadedBundles.has(bundleName)) {
      this.log(`Bundle already loaded: ${bundleName}`);
      return Promise.resolve();
    }

    if (this.loadingPromises.has(bundleName)) {
      this.log(`Bundle already loading: ${bundleName}`);
      return this.loadingPromises.get(bundleName)!;
    }

    const loadOptions = {
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      timeout: 30000,
      ...options
    };

    const promise = this.loadScriptWithRetry(bundleName, loadOptions);
    this.loadingPromises.set(bundleName, promise);
    
    try {
      await promise;
      this.loadedBundles.add(bundleName);
      this.loadingPromises.delete(bundleName);
      this.log(`✅ Bundle loaded: ${bundleName}`);
    } catch (error) {
      this.loadingPromises.delete(bundleName);
      this.log(`❌ Failed to load bundle: ${bundleName}`, error);
      throw error;
    }
  }

  /**
   * Load external libraries with caching
   */
  async loadExternalLibrary(libName: string, url: string, options: LoadOptions = {}): Promise<void> {
    if (this.loadedBundles.has(libName)) {
      this.log(`External library already loaded: ${libName}`);
      return Promise.resolve();
    }

    if (this.loadingPromises.has(libName)) {
      this.log(`External library already loading: ${libName}`);
      return this.loadingPromises.get(libName)!;
    }

    const loadOptions = {
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      timeout: 30000,
      ...options
    };

    const promise = this.loadScriptWithRetry(libName, loadOptions, url);
    this.loadingPromises.set(libName, promise);
    
    try {
      await promise;
      this.loadedBundles.add(libName);
      this.loadingPromises.delete(libName);
      this.log(`✅ External library loaded: ${libName}`);
    } catch (error) {
      this.loadingPromises.delete(libName);
      this.log(`❌ Failed to load library: ${libName}`, error);
      throw error;
    }
  }

  /**
   * Load accessibility features on user interaction
   */
  async loadAccessibilityFeatures(): Promise<void> {
    if (!this.modulesLoaded.has('accessibility')) {
      return this.loadBundle('accessibility');
    }
    return Promise.resolve();
  }

  /**
   * Load interactive features including search
   */
  async loadInteractiveFeatures(): Promise<void> {
    // Only load external libraries, not the old interactive bundle
    // since we're using modular TypeScript components now
    // Load Fuse.js from local assets to comply with CSP and avoid third-party fetches
    await Promise.all([
      this.loadBundle('fuse')
    ]);
  }

  /**
   * Load form validation features
   */
  async loadFormFeatures(): Promise<void> {
    return this.loadBundle('forms');
  }

  /**
   * Mark a module as loaded (for modular components)
   */
  markModuleLoaded(moduleName: string): void {
    this.modulesLoaded.add(moduleName);
    this.log(`✅ Module marked as loaded: ${moduleName}`);
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleName: string): boolean {
    return this.modulesLoaded.has(moduleName);
  }

  /**
   * Check if a bundle is loaded
   */
  isBundleLoaded(bundleName: string): boolean {
    return this.loadedBundles.has(bundleName);
  }

  /**
   * Get loading status for all bundles
   */
  getLoadingStatus(): {
    loadedBundles: string[];
    loadingBundles: string[];
    loadedModules: string[];
  } {
    return {
      loadedBundles: Array.from(this.loadedBundles),
      loadingBundles: Array.from(this.loadingPromises.keys()),
      loadedModules: Array.from(this.modulesLoaded)
    };
  }

  /**
   * Load script with retry logic
   */
  private async loadScriptWithRetry(
    name: string, 
    options: Required<LoadOptions>, 
    customUrl?: string
  ): Promise<void> {
    const url = customUrl || `${this.config.basePath}${name}.min.js`;
    
    for (let attempt = 1; attempt <= options.retryAttempts; attempt++) {
      try {
        await this.loadScript(url, options.timeout);
        return;
      } catch (error) {
        this.log(`Attempt ${attempt}/${options.retryAttempts} failed for ${name}:`, error);
        
        if (attempt === options.retryAttempts) {
          throw new Error(`Failed to load ${name} after ${options.retryAttempts} attempts`, { cause: error });
        }
        
        // Wait before retrying
        await this.delay(options.retryDelay * attempt);
      }
    }
  }

  /**
   * Load a single script
   */
  private loadScript(url: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading script: ${url}`));
      }, timeout);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utility
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.enableLogging) {
      console.log(`[LazyLoader] ${message}`, ...args);
    }
  }
}

// Initialize global loader
export function initLazyBundleLoader(config?: LazyLoaderConfig): LazyBundleLoader {
  if (typeof window !== 'undefined') {
    window.LazyBundleLoader = new LazyBundleLoader(config);
    return window.LazyBundleLoader;
  }
  
  return new LazyBundleLoader(config);
}

// Load accessibility features on first user interaction
export function setupAccessibilityLoading(loader: LazyBundleLoader): void {
  if (typeof document === 'undefined') return;
  
  const events = ['keydown', 'click', 'focus'];
  const loadOnce = () => {
    loader.loadAccessibilityFeatures();
    events.forEach(event => {
      document.removeEventListener(event, loadOnce, true);
    });
  };
  
  events.forEach(event => {
    document.addEventListener(event, loadOnce, true);
  });

  // Load immediately if user has accessibility preferences
  if (typeof localStorage !== 'undefined' && localStorage.getItem('accessibility-preferences')) {
    loadOnce();
  }
}

// Initialize progressive loading
export function setupProgressiveLoading(loader: LazyBundleLoader): void {
  if (typeof document === 'undefined') return;
  
  const loadInteractive = () => {
    setTimeout(() => loader.loadInteractiveFeatures(), 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadInteractive);
  } else {
    loadInteractive();
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  const loader = initLazyBundleLoader();
  (window as Window & { LazyBundleLoader?: LazyBundleLoader }).LazyBundleLoader = loader;
  setupAccessibilityLoading(loader);
  setupProgressiveLoading(loader);
} 