/**
 * Dynamic Module Loader
 * Implements dynamic imports for non-critical modules to optimize bundle size
 */

import { createModuleErrorReporter } from './ModuleErrorHandling';

// Define module types for better organization
export interface ModuleConfig {
  name: string;
  path: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  loadTrigger?: 'immediate' | 'interaction' | 'visible' | 'idle';
  size?: number; // Estimated size in bytes
}

export interface LoadedModule {
  name: string;
  instance: any;
  loadTime: number;
  size?: number;
}

export class DynamicModuleLoader {
  private loadedModules = new Map<string, LoadedModule>();
  private loadingPromises = new Map<string, Promise<any>>();
  private moduleConfigs = new Map<string, ModuleConfig>();
  private errorReporter = createModuleErrorReporter('DynamicModuleLoader');
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    this.setupModuleRegistry();
    this.setupIntersectionObserver();
  }

  /**
   * Register available modules for dynamic loading
   */
  private setupModuleRegistry(): void {
    const modules: ModuleConfig[] = [
      // Critical modules (loaded immediately)
      {
        name: 'analytics',
        path: '../modules/Analytics',
        priority: 'critical',
        loadTrigger: 'immediate',
        size: 15000
      },
      {
        name: 'accessibility',
        path: '../modules/AccessibilityModule',
        priority: 'critical',
        loadTrigger: 'interaction',
        size: 8000
      },

      // High priority modules (loaded on interaction)
      {
        name: 'search',
        path: '../features/EnhancedSearchOverlay',
        priority: 'high',
        loadTrigger: 'interaction',
        size: 25000,
        dependencies: ['fuse.js']
      },
      {
        name: 'navigation',
        path: '../features/ModernNavBar',
        priority: 'high',
        loadTrigger: 'immediate',
        size: 12000
      },

      // Medium priority modules (loaded when visible or on idle)
      {
        name: 'formValidation',
        path: '../utils/FormValidation',
        priority: 'medium',
        loadTrigger: 'visible',
        size: 18000
      },
      {
        name: 'scrollEffects',
        path: '../utils/ScrollEffects',
        priority: 'medium',
        loadTrigger: 'visible',
        size: 10000
      },

      // Low priority modules (loaded on idle)
      {
        name: 'progressiveEnhancement',
        path: '../utils/ProgressiveEnhancement',
        priority: 'low',
        loadTrigger: 'idle',
        size: 8000
      },
      {
        name: 'dropdownManager',
        path: '../modules/DropdownManager',
        priority: 'low',
        loadTrigger: 'interaction',
        size: 6000
      }
    ];

    modules.forEach(config => {
      this.moduleConfigs.set(config.name, config);
    });
  }

  /**
   * Setup intersection observer for visibility-based loading
   */
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const moduleName = entry.target.getAttribute('data-module-load');
            if (moduleName) {
              this.loadModule(moduleName);
              this.intersectionObserver?.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
  }

  /**
   * Load a module dynamically
   */
  async loadModule(moduleName: string): Promise<any> {
    // Return if already loaded
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName)?.instance;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const config = this.moduleConfigs.get(moduleName);
    if (!config) {
      this.errorReporter.reportError(
        'MODULE_CONFIG_NOT_FOUND',
        `Module configuration not found: ${moduleName}`,
        'medium' as any
      );
      return null;
    }

    const startTime = performance.now();
    const loadingPromise = this.performModuleLoad(config);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      const loadTime = performance.now() - startTime;

      const loadedModule: LoadedModule = {
        name: moduleName,
        instance: module,
        loadTime,
        size: config.size
      };

      this.loadedModules.set(moduleName, loadedModule);
      this.loadingPromises.delete(moduleName);

      console.log(`✅ Module loaded: ${moduleName} (${loadTime.toFixed(2)}ms)`);
      return module;

    } catch (error) {
      this.loadingPromises.delete(moduleName);
      this.errorReporter.reportError(
        'MODULE_LOAD_ERROR',
        `Failed to load module ${moduleName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'high' as any,
        { additionalData: { moduleName, modulePath: config.path } }
      );
      return null;
    }
  }

  /**
   * Perform the actual module loading with dynamic import
   */
  private async performModuleLoad(config: ModuleConfig): Promise<any> {
    // Load dependencies first if any
    if (config.dependencies) {
      await this.loadDependencies(config.dependencies);
    }

    // Dynamic import based on module type
    try {
      const module = await import(config.path);
      
      // Handle different export patterns
      if (module.default) {
        return typeof module.default === 'function' ? new module.default() : module.default;
      }
      
      // Handle named exports (e.g., Analytics class)
      const exportNames = Object.keys(module);
      if (exportNames.length === 1) {
        const exportedClass = module[exportNames[0]];
        return typeof exportedClass === 'function' ? new exportedClass() : exportedClass;
      }
      
      return module;
    } catch (error) {
      throw new Error(`Dynamic import failed for ${config.path}: ${error}`);
    }
  }

  /**
   * Load external dependencies
   */
  private async loadDependencies(dependencies: string[]): Promise<void> {
    const promises = dependencies.map(dep => this.loadExternalDependency(dep));
    await Promise.all(promises);
  }

  /**
   * Load external dependency (like CDN scripts)
   */
  private loadExternalDependency(dependency: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      // Map common dependencies to CDN URLs
      const cdnUrls: Record<string, string> = {
        'fuse.js': 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js',
        'chartjs': 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
      };

      script.src = cdnUrls[dependency] || dependency;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load dependency: ${dependency}`));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Load modules based on priority and triggers
   */
  public initializeModuleLoading(): void {
    // Load critical modules immediately
    this.loadCriticalModules();

    // Setup interaction-based loading
    this.setupInteractionLoading();

    // Setup idle loading
    this.setupIdleLoading();

    // Setup visibility-based loading
    this.setupVisibilityLoading();
  }

  /**
   * Load critical modules immediately
   */
  private loadCriticalModules(): void {
    const criticalModules = Array.from(this.moduleConfigs.values())
      .filter(config => config.priority === 'critical' && config.loadTrigger === 'immediate');

    criticalModules.forEach(config => {
      this.loadModule(config.name);
    });
  }

  /**
   * Setup loading modules on user interaction
   */
  private setupInteractionLoading(): void {
    const interactionModules = Array.from(this.moduleConfigs.values())
      .filter(config => config.loadTrigger === 'interaction');

    if (interactionModules.length === 0) return;

    const events = ['click', 'keydown', 'touchstart', 'mouseover'];
    const loadOnFirstInteraction = () => {
      interactionModules.forEach(config => {
        this.loadModule(config.name);
      });

      // Remove listeners after first interaction
      events.forEach(event => {
        document.removeEventListener(event, loadOnFirstInteraction, true);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, loadOnFirstInteraction, true);
    });
  }

  /**
   * Setup loading modules on idle
   */
  private setupIdleLoading(): void {
    const idleModules = Array.from(this.moduleConfigs.values())
      .filter(config => config.loadTrigger === 'idle');

    if (idleModules.length === 0) return;

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        idleModules.forEach(config => {
          this.loadModule(config.name);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        idleModules.forEach(config => {
          this.loadModule(config.name);
        });
      }, 2000);
    }
  }

  /**
   * Setup visibility-based loading
   */
  private setupVisibilityLoading(): void {
    if (!this.intersectionObserver) return;

    const visibilityModules = Array.from(this.moduleConfigs.values())
      .filter(config => config.loadTrigger === 'visible');

    // Find elements that should trigger these modules
    visibilityModules.forEach(config => {
      const elements = document.querySelectorAll(`[data-module-load="${config.name}"]`);
      elements.forEach(element => {
        this.intersectionObserver?.observe(element);
      });
    });
  }

  /**
   * Get module loading statistics
   */
  public getLoadingStats(): {
    totalModules: number;
    loadedCount: number;
    loadingCount: number;
    totalLoadTime: number;
    estimatedSavings: number;
  } {
    const totalModules = this.moduleConfigs.size;
    const loadedCount = this.loadedModules.size;
    const loadingCount = this.loadingPromises.size;
    
    const totalLoadTime = Array.from(this.loadedModules.values())
      .reduce((sum, module) => sum + module.loadTime, 0);

    const estimatedSavings = Array.from(this.moduleConfigs.values())
      .filter(config => config.priority !== 'critical')
      .reduce((sum, config) => sum + (config.size || 0), 0);

    return {
      totalModules,
      loadedCount,
      loadingCount,
      totalLoadTime: Math.round(totalLoadTime),
      estimatedSavings
    };
  }

  /**
   * Preload a module (load but don't initialize)
   */
  public async preloadModule(moduleName: string): Promise<void> {
    const config = this.moduleConfigs.get(moduleName);
    if (!config) return;

    if (this.loadedModules.has(moduleName) || this.loadingPromises.has(moduleName)) {
      return;
    }

    // Use link preload for the module
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = config.path;
    document.head.appendChild(link);
  }

  /**
   * Check if a module is loaded
   */
  public isModuleLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Get loaded module instance
   */
  public getModule<T = any>(moduleName: string): T | null {
    return this.loadedModules.get(moduleName)?.instance || null;
  }
}

// Initialize and export global instance
let globalLoader: DynamicModuleLoader;

export function initDynamicModuleLoader(): DynamicModuleLoader {
  if (!globalLoader) {
    globalLoader = new DynamicModuleLoader();
    
    if (typeof window !== 'undefined') {
      (window as any).dynamicModuleLoader = globalLoader;
    }
  }
  
  return globalLoader;
}

export function getDynamicModuleLoader(): DynamicModuleLoader {
  return globalLoader || initDynamicModuleLoader();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const loader = initDynamicModuleLoader();
      loader.initializeModuleLoading();
    });
  } else {
    const loader = initDynamicModuleLoader();
    loader.initializeModuleLoading();
  }
}
