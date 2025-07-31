/**
 * Feature-Based Bundle Manager
 * Groups related modules into optimized bundles for better loading performance
 */

import { getDynamicModuleLoader } from './DynamicModuleLoader';
import { createModuleErrorReporter } from './ModuleErrorHandling';

export interface FeatureBundleConfig {
  name: string;
  modules: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  loadTrigger: 'immediate' | 'interaction' | 'visible' | 'route';
  estimatedSize: number;
  dependencies?: string[];
}

export interface BundleLoadResult {
  bundleName: string;
  loadedModules: string[];
  loadTime: number;
  success: boolean;
  errors?: string[];
}

export class FeatureBundleManager {
  private loadedBundles = new Set<string>();
  private loadingPromises = new Map<string, Promise<BundleLoadResult>>();
  private bundleConfigs = new Map<string, FeatureBundleConfig>();
  private errorReporter = createModuleErrorReporter('FeatureBundleManager');
  private dynamicLoader = getDynamicModuleLoader();

  constructor() {
    this.setupBundleConfigurations();
  }

  /**
   * Define feature bundles for optimal loading
   */
  private setupBundleConfigurations(): void {
    const bundles: FeatureBundleConfig[] = [
      // Core Bundle - Critical features loaded immediately
      {
        name: 'core',
        modules: ['analytics', 'accessibility', 'navigation'],
        priority: 'critical',
        loadTrigger: 'immediate',
        estimatedSize: 35000
      },

      // Search Bundle - Loaded on search interaction
      {
        name: 'search',
        modules: ['search'],
        priority: 'high',
        loadTrigger: 'interaction',
        estimatedSize: 25000,
        dependencies: ['fuse.js']
      },

      // Forms Bundle - Loaded when forms are visible
      {
        name: 'forms',
        modules: ['formValidation'],
        priority: 'medium',
        loadTrigger: 'visible',
        estimatedSize: 18000
      },

      // Enhancement Bundle - Loaded on idle
      {
        name: 'enhancements',
        modules: ['scrollEffects', 'progressiveEnhancement', 'dropdownManager'],
        priority: 'low',
        loadTrigger: 'route',
        estimatedSize: 24000
      }
    ];

    bundles.forEach(config => {
      this.bundleConfigs.set(config.name, config);
    });
  }

  /**
   * Load a feature bundle
   */
  async loadBundle(bundleName: string): Promise<BundleLoadResult> {
    if (this.loadedBundles.has(bundleName)) {
      return {
        bundleName,
        loadedModules: [],
        loadTime: 0,
        success: true
      };
    }

    if (this.loadingPromises.has(bundleName)) {
      return this.loadingPromises.get(bundleName)!;
    }

    const config = this.bundleConfigs.get(bundleName);
    if (!config) {
      const error = `Bundle configuration not found: ${bundleName}`;
      this.errorReporter.reportError('BUNDLE_CONFIG_NOT_FOUND', error);
      return {
        bundleName,
        loadedModules: [],
        loadTime: 0,
        success: false,
        errors: [error]
      };
    }

    const loadingPromise = this.performBundleLoad(config);
    this.loadingPromises.set(bundleName, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadedBundles.add(bundleName);
      this.loadingPromises.delete(bundleName);
      return result;
    } catch (error) {
      this.loadingPromises.delete(bundleName);
      throw error;
    }
  }

  /**
   * Perform the actual bundle loading
   */
  private async performBundleLoad(config: FeatureBundleConfig): Promise<BundleLoadResult> {
    const startTime = performance.now();
    const loadedModules: string[] = [];
    const errors: string[] = [];

    try {
      // Load all modules in the bundle concurrently
      const modulePromises = config.modules.map(async (moduleName) => {
        try {
          await this.dynamicLoader.loadModule(moduleName);
          loadedModules.push(moduleName);
          return true;
        } catch (error) {
          const errorMsg = `Failed to load module ${moduleName}: ${error}`;
          errors.push(errorMsg);
          this.errorReporter.reportError('MODULE_LOAD_ERROR', errorMsg);
          return false;
        }
      });

      await Promise.allSettled(modulePromises);

      const loadTime = performance.now() - startTime;
      const success = errors.length === 0;

      console.log(`${success ? '✅' : '⚠️'} Bundle loaded: ${config.name} (${loadTime.toFixed(2)}ms, ${loadedModules.length}/${config.modules.length} modules)`);

      return {
        bundleName: config.name,
        loadedModules,
        loadTime,
        success,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const loadTime = performance.now() - startTime;
      const errorMsg = `Bundle loading failed: ${error}`;
      
      this.errorReporter.reportError('BUNDLE_LOAD_ERROR', errorMsg);

      return {
        bundleName: config.name,
        loadedModules,
        loadTime,
        success: false,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Load bundles based on route/page context
   */
  async loadBundlesForRoute(routePath: string): Promise<BundleLoadResult[]> {
    const routeBundles = this.getBundlesForRoute(routePath);
    
    const promises = routeBundles.map(bundleName => this.loadBundle(bundleName));
    return Promise.all(promises);
  }

  /**
   * Determine which bundles to load for a given route
   */
  private getBundlesForRoute(routePath: string): string[] {
    const bundles: string[] = [];

    // Always load core bundle
    bundles.push('core');

    // Route-specific bundle loading logic
    if (routePath.includes('/search') || routePath.includes('?search=')) {
      bundles.push('search');
    }

    if (routePath.includes('/contact') || routePath.includes('/feedback')) {
      bundles.push('forms');
    }

    // Load enhancement bundle for all routes (on idle)
    bundles.push('enhancements');

    return bundles;
  }

  /**
   * Preload bundles for better performance
   */
  async preloadBundles(bundleNames: string[]): Promise<void> {
    const preloadPromises = bundleNames.map(async (bundleName) => {
      const config = this.bundleConfigs.get(bundleName);
      if (!config) return;

      // Preload modules in the bundle
      const modulePromises = config.modules.map(moduleName => 
        this.dynamicLoader.preloadModule(moduleName)
      );

      await Promise.allSettled(modulePromises);
    });

    await Promise.allSettled(preloadPromises);
    console.log(`📦 Preloaded bundles: ${bundleNames.join(', ')}`);
  }

  /**
   * Get bundle loading statistics
   */
  getBundleStats(): {
    totalBundles: number;
    loadedBundles: number;
    totalEstimatedSize: number;
    loadedSize: number;
    bundleDetails: Array<{
      name: string;
      loaded: boolean;
      moduleCount: number;
      estimatedSize: number;
    }>;
  } {
    const bundleDetails = Array.from(this.bundleConfigs.entries()).map(([name, config]) => ({
      name,
      loaded: this.loadedBundles.has(name),
      moduleCount: config.modules.length,
      estimatedSize: config.estimatedSize
    }));

    const totalEstimatedSize = bundleDetails.reduce((sum, bundle) => sum + bundle.estimatedSize, 0);
    const loadedSize = bundleDetails
      .filter(bundle => bundle.loaded)
      .reduce((sum, bundle) => sum + bundle.estimatedSize, 0);

    return {
      totalBundles: this.bundleConfigs.size,
      loadedBundles: this.loadedBundles.size,
      totalEstimatedSize,
      loadedSize,
      bundleDetails
    };
  }

  /**
   * Initialize smart bundle loading based on page context
   */
  initializeSmartLoading(): void {
    if (typeof window === 'undefined') return;

    // Load core bundle immediately
    this.loadBundle('core');

    // Setup route-based loading
    this.setupRouteBasedLoading();

    // Setup interaction-based loading
    this.setupInteractionBasedLoading();

    // Setup visibility-based loading
    this.setupVisibilityBasedLoading();

    // Preload likely-needed bundles on idle
    this.setupIdlePreloading();
  }

  /**
   * Setup route-based bundle loading
   */
  private setupRouteBasedLoading(): void {
    const currentPath = window.location.pathname + window.location.search;
    this.loadBundlesForRoute(currentPath);

    // Listen for navigation changes (if using client-side routing)
    window.addEventListener('popstate', () => {
      const newPath = window.location.pathname + window.location.search;
      this.loadBundlesForRoute(newPath);
    });
  }

  /**
   * Setup interaction-based bundle loading
   */
  private setupInteractionBasedLoading(): void {
    // Load search bundle on search-related interactions
    const searchTriggers = document.querySelectorAll('[data-search], .search-toggle, #search-toggle');
    searchTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.loadBundle('search'), { once: true });
      trigger.addEventListener('focus', () => this.loadBundle('search'), { once: true });
    });

    // Load forms bundle on form interactions
    const formTriggers = document.querySelectorAll('form, [data-form]');
    formTriggers.forEach(trigger => {
      trigger.addEventListener('focus', () => this.loadBundle('forms'), { once: true });
    });
  }

  /**
   * Setup visibility-based bundle loading
   */
  private setupVisibilityBasedLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bundleName = entry.target.getAttribute('data-bundle-load');
          if (bundleName) {
            this.loadBundle(bundleName);
            observer.unobserve(entry.target);
          }
        }
      });
    }, { rootMargin: '100px' });

    // Observe elements that should trigger bundle loading
    document.querySelectorAll('[data-bundle-load]').forEach(element => {
      observer.observe(element);
    });
  }

  /**
   * Setup idle preloading of enhancement bundles
   */
  private setupIdlePreloading(): void {
    const preloadEnhancements = () => {
      this.preloadBundles(['enhancements']);
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadEnhancements, { timeout: 5000 });
    } else {
      setTimeout(preloadEnhancements, 3000);
    }
  }

  /**
   * Check if a bundle is loaded
   */
  isBundleLoaded(bundleName: string): boolean {
    return this.loadedBundles.has(bundleName);
  }

  /**
   * Get all loaded bundles
   */
  getLoadedBundles(): string[] {
    return Array.from(this.loadedBundles);
  }
}

// Global instance management
let globalBundleManager: FeatureBundleManager;

export function initFeatureBundleManager(): FeatureBundleManager {
  if (!globalBundleManager) {
    globalBundleManager = new FeatureBundleManager();
    
    if (typeof window !== 'undefined') {
      (window as any).featureBundleManager = globalBundleManager;
    }
  }
  
  return globalBundleManager;
}

export function getFeatureBundleManager(): FeatureBundleManager {
  return globalBundleManager || initFeatureBundleManager();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const manager = initFeatureBundleManager();
      manager.initializeSmartLoading();
    });
  } else {
    const manager = initFeatureBundleManager();
    manager.initializeSmartLoading();
  }
}
